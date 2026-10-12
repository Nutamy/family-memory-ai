import { NextResponse } from "next/server";
import { z } from "zod";
import { archiveBaseName } from "@/lib/archive";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { loadPersonBundle } from "@/lib/data";
import { buildProfileJson } from "@/lib/export";
import { db } from "@/lib/db";
import { resumeUrl } from "@/lib/guest";
import { botToken, escapeHtml, ownerChatId, sendText, TelegramClient } from "@/lib/integrations/telegram";
import { buildReport, type PersonalityReport } from "@/lib/report";
import { rateLimit } from "@/lib/security/rate-limit";
import { sendAudioBatch } from "@/lib/telegram-delivery";
import { formatMinutes } from "@/lib/utils";

const schema = z.object({
  items: z.array(z.enum(["report", "json", "audio", "wav"])).min(1).default(["report", "json"]),
  // Position in the audio delivery plan; 0 starts a new delivery (report and JSON go first).
  cursor: z.number().int().min(0).max(100_000).default(0),
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

/**
 * Sends the report text, profile.json and audio (MP3 and/or WAV) to the person's own chat,
 * with a copy to the owner's chat (TELEGRAM_CHAT_ID) when set.
 * Audio goes in batches: the client repeats the call with `next` until it is null.
 */
export const POST = route<{ id: string }>(async (req, { id }) => {
  const person = await assertPersonAccess(id);
  const token = botToken();
  if (!token) throw new HttpError(501, "Telegram не настроен: задайте TELEGRAM_BOT_TOKEN");
  const user = await db.user.findUniqueOrThrow({ where: { id: person.userId }, select: { telegramChatId: true } });
  if (!user.telegramChatId) throw new HttpError(409, "Сначала подключите Telegram");
  const tg = new TelegramClient(token, user.telegramChatId, ownerChatId());
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, "Некорректные данные");
  const items = new Set(parsed.data.items);
  const { cursor } = parsed.data;
  const first = cursor === 0;
  // A delivery can push hundreds of MB to Telegram — cap new deliveries and batches per account.
  if (first) await rateLimit(`tg:${person.userId}`, { limit: 5, windowSec: 600 });
  await rateLimit(`tg-batch:${person.userId}`, { limit: 300, windowSec: 600 });

  const bundle = await loadPersonBundle(id);
  const profile = buildProfileJson(bundle);
  const base = archiveBaseName(bundle);
  const sent: string[] = [];
  let documents = 0;
  let next: number | null = null;
  let total = 0;

  try {
    if (first && items.has("report")) {
      const { computeProgress } = await import("@/lib/progress");
      const { loadProgressInput } = await import("@/lib/data");
      const progress = computeProgress(await loadProgressInput(id)).overall.percent;
      await tg.sendMessage(reportMessage(buildReport(bundle), progress));
      // Sent outside TelegramClient so the owner's copy never contains this bearer link.
      const resume = await resumeUrl(new URL(req.url).origin, person.userId);
      await sendText(token, user.telegramChatId, `🔗 Продолжить заполнение или дополнить ответы: ${escapeHtml(resume)}`);
      sent.push("report");
    }
    if (first && items.has("json")) {
      await tg.sendDocument(new TextEncoder().encode(JSON.stringify(profile, null, 2)), `${base}-profile.json`, "Профиль: все ответы, тесты и воспоминания");
      sent.push("json");
      documents++;
    }
    const formats = (["mp3", "wav"] as const).filter((f) => items.has(f === "mp3" ? "audio" : "wav"));
    if (formats.length) {
      if (!bundle.voiceRecords.length) throw new HttpError(400, "Нет аудиозаписей для отправки");
      const batch = await sendAudioBatch(tg, bundle, [...formats], cursor);
      documents += batch.sent;
      ({ next, total } = batch);
      sent.push(...formats.map((f) => (f === "mp3" ? "audio" : "wav")));
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(502, e instanceof Error ? e.message : "Ошибка отправки в Telegram");
  }
  return NextResponse.json({ ok: true, sent, documents, next, total });
});
