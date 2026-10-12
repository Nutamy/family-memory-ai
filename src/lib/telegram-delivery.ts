import "server-only";
import JSZip from "jszip";
import { archiveBaseName, recordMeta, transcriptFileName } from "./archive";
import type { PersonBundle } from "./data";
import { audioFileName } from "./export";
import { TELEGRAM_MAX_FILE_BYTES, type TelegramClient } from "./integrations/telegram";
import { storage } from "./storage";

// Bots may upload at most 50 MB per file, so audio goes out as several ZIP parts.
// Recordings are packed whole into parts; a single file larger than a part is sent as
// raw byte chunks (name.wav.001, .002, …) that 7-Zip or `cat` join back together.

export type AudioFormat = "wav" | "mp3";

const MB = 1024 * 1024;
// Room for ZIP local/central headers of every entry plus the small index files.
const ZIP_HEADROOM = 2 * MB;

/**
 * Part size: TELEGRAM_PART_MB or 45 MB, never above the bot limit. On Workers keep it
 * lower (wrangler.jsonc sets 20): a part is held in memory twice (files + generated ZIP)
 * within the 128 MB isolate limit.
 */
export function partLimitBytes() {
  const mb = Number(process.env.TELEGRAM_PART_MB);
  const wanted = Number.isFinite(mb) && mb > 0 ? mb * MB : 45 * MB;
  return Math.max(MB, Math.min(wanted, TELEGRAM_MAX_FILE_BYTES - ZIP_HEADROOM));
}

interface Entry {
  record: number;
  format: AudioFormat;
  key: string;
  name: string;
  size: number;
}

type Delivery =
  | { kind: "zip"; entries: Entry[]; withIndex: boolean }
  | { kind: "chunk"; entry: Entry; index: number; count: number; offset: number; length: number };

/** Greedy packing in recording order, so parts stay chronological. Exported for tests. */
export function planDelivery(entries: Entry[], limit: number, indexBytes: number): Delivery[] {
  const plan: Delivery[] = [];
  let zip: Extract<Delivery, { kind: "zip" }> | null = null;
  let used = 0;
  // Scaled down for tiny test-sized parts so the budget never goes negative.
  const budget = limit - Math.min(ZIP_HEADROOM, limit / 10);

  for (const e of entries) {
    if (e.size > budget) {
      const count = Math.ceil(e.size / limit);
      for (let i = 0; i < count; i++) {
        const offset = i * limit;
        plan.push({ kind: "chunk", entry: e, index: i + 1, count, offset, length: Math.min(limit, e.size - offset) });
      }
      continue;
    }
    if (!zip || used + e.size > budget) {
      zip = { kind: "zip", entries: [], withIndex: false };
      plan.push(zip);
      used = 0;
    }
    zip.entries.push(e);
    used += e.size;
  }

  // metadata.json and transcripts ride in the first ZIP if they fit, else get their own.
  const first = plan.find((d) => d.kind === "zip");
  const firstUsed = first?.entries.reduce((s, e) => s + e.size, 0) ?? 0;
  if (first && firstUsed + indexBytes <= budget) first.withIndex = true;
  else plan.unshift({ kind: "zip", entries: [], withIndex: true });
  return plan;
}

const pad3 = (n: number) => String(n).padStart(3, "0");
const baseName = (path: string) => path.split("/").pop()!;

/** Sends all recordings in the given formats; returns the number of Telegram documents sent. */
export async function sendAudioInParts(tg: TelegramClient, bundle: PersonBundle, formats: AudioFormat[]) {
  const store = storage();
  const entries: Entry[] = [];
  for (const [i, v] of bundle.voiceRecords.entries()) {
    for (const format of formats) {
      const key = format === "wav" ? v.wavKey : v.mp3Key;
      if (!key) continue;
      const size = await store.size(key);
      // Missing file in storage — keep delivering the rest, like the ZIP export does.
      if (size !== null) entries.push({ record: i, format, key, size, name: audioFileName(v, i, format) });
    }
  }

  const base = `${archiveBaseName(bundle)}-audio-${formats.join("-")}`;
  const transcripts = bundle.voiceRecords.map((v, i) => ({ name: transcriptFileName(v, i), text: v.transcription })).filter((t) => t.text.trim());
  const indexBytes = transcripts.reduce((s, t) => s + new TextEncoder().encode(t.text).byteLength, 0) + 64 * 1024;
  const plan = planDelivery(entries, partLimitBytes(), indexBytes);
  const total = plan.length;
  const partName = (n: number) => (total === 1 ? `${base}.zip` : `${base}-part${pad3(n)}-of-${pad3(total)}.zip`);

  // Where each file ended up, so metadata.json tells which part to look in.
  const located = new Map<string, unknown>();
  plan.forEach((d, i) => {
    if (d.kind === "zip") for (const e of d.entries) located.set(`${e.record}:${e.format}`, { path: e.name, part: partName(i + 1) });
    else if (d.index === 1) {
      const parts = Array.from({ length: d.count }, (_, k) => `${baseName(d.entry.name)}.${pad3(k + 1)}`);
      located.set(`${d.entry.record}:${d.entry.format}`, { split: parts });
    }
  });
  const metadata = bundle.voiceRecords.map((v, i) => {
    const files: Record<string, unknown> = {};
    for (const f of formats) if (located.has(`${i}:${f}`)) files[f] = located.get(`${i}:${f}`);
    return recordMeta(v, files);
  });

  for (const [i, d] of plan.entries()) {
    const n = i + 1;
    const label = total > 1 ? `часть ${n} из ${total}` : "";
    if (d.kind === "chunk") {
      const data = await store.getRange(d.entry.key, d.offset, d.length);
      const file = baseName(d.entry.name);
      const hint =
        d.index === 1
          ? `\nФайл разбит на ${d.count} части. Соберите: 7-Zip → открыть ${file}.001, или <code>cat ${file}.0* &gt; ${file}</code>`
          : "";
      await tg.sendDocument(data, `${file}.${pad3(d.index)}`, `🎙 ${file} — кусок ${d.index} из ${d.count} (${label})${hint}`);
      continue;
    }
    const zip = new JSZip();
    // Audio is already compressed (MP3) or barely compressible (PCM): STORE keeps CPU low on Workers.
    for (const e of d.entries) zip.file(e.name, await store.get(e.key), { compression: "STORE" });
    if (d.withIndex) {
      zip.file("audio/metadata.json", JSON.stringify(metadata, null, 2));
      for (const t of transcripts) zip.file(t.name, t.text);
    }
    const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 4 } });
    const what = d.entries.length ? `файлов: ${d.entries.length}` : "описание и расшифровки";
    await tg.sendDocument(bytes, partName(n), `🎙 Аудио (${formats.join(" + ").toUpperCase()})${label ? `, ${label}` : ""}: ${what}`);
  }
  return total;
}
