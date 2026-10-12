import { NextResponse } from "next/server";
import { z } from "zod";
import { archiveBaseName, buildArchiveZip } from "@/lib/archive";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { loadPersonBundle } from "@/lib/data";
import { buildProfileJson } from "@/lib/export";
import { escapeHtml, getTelegramClient } from "@/lib/integrations/telegram";
import { buildReport, type PersonalityReport } from "@/lib/report";
import { formatMinutes } from "@/lib/utils";

const schema = z.object({
  items: z.array(z.enum(["report", "json", "audio"])).min(1).default(["report", "json"]),
});

function reportMessage(r: PersonalityReport, progress: number) {
  const e = escapeHtml;
  const lines = [`<b>📜 ${e(r.name)}</b>`, `Архив заполнен на ${progress}%`, "", ...r.summary.map(e)];
  if (r.bigFive) {
    lines.push("", "<b>Big Five</b>", ...r.bigFive.map((t) => `• ${e(t.title)}: ${t.value}`));
  }
  if (r.mbti) lines.push("", `<b>MBTI:</b> ${r.mbti.type} — ${e(r.mbti.name)}`);
  if (r.temperament) lines.push(`<b>Темперамент:</b> ${e(r.temperament.title)}`);
  if (r.values.length) lines.push("", "<b>Ценности</b>", ...r.values.map((v) => `• ${e(v)}`));
  lines.push(
    "",
    `✍️ ${r.stats.words} слов · 📚 ${r.stats.memories} воспоминаний · 🎙 ${r.stats.recordings} записей (${formatMinutes(r.stats.minutes * 60)} мин)`,
  );
  return lines.join("\n");
}

/** Sends the report text, profile.json and/or an MP3 archive to the configured Telegram chat. */
export const POST = route<{ id: string }>(async (req, { id }) => {
  await assertPersonAccess(id);
  const tg = getTelegramClient();
  if (!tg) throw new HttpError(501, "Telegram не настроен: задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID");
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, "Некорректные данные");
  const items = new Set(parsed.data.items);

  const bundle = await loadPersonBundle(id);
  const profile = buildProfileJson(bundle);
  const base = archiveBaseName(bundle);
  const sent: string[] = [];

  try {
    if (items.has("report")) {
      const { computeProgress } = await import("@/lib/progress");
      const { loadProgressInput } = await import("@/lib/data");
      const progress = computeProgress(await loadProgressInput(id)).overall.percent;
      await tg.sendMessage(reportMessage(buildReport(bundle), progress));
      sent.push("report");
    }
    if (items.has("json")) {
      await tg.sendDocument(new TextEncoder().encode(JSON.stringify(profile, null, 2)), `${base}-profile.json`, "Профиль: все ответы, тесты и воспоминания");
      sent.push("json");
    }
    if (items.has("audio")) {
      if (!bundle.voiceRecords.length) throw new HttpError(400, "Нет аудиозаписей для отправки");
      // MP3 only: WAV quickly exceeds the 50 MB bot upload limit.
      const zip = await buildArchiveZip(bundle, { full: false, formats: ["mp3"] });
      await tg.sendDocument(zip, `${base}-audio-mp3.zip`, `Аудиозаписи: ${bundle.voiceRecords.length} шт.`);
      sent.push("audio");
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(502, e instanceof Error ? e.message : "Ошибка отправки в Telegram");
  }
  return NextResponse.json({ ok: true, sent });
});
