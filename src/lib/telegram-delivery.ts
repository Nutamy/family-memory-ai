import "server-only";
import JSZip from "jszip";
import { archiveBaseName, recordMeta, transcriptFileName } from "./archive";
import type { PersonBundle } from "./data";
import { audioFileName } from "./export";
import { TELEGRAM_MAX_FILE_BYTES, type TelegramClient } from "./integrations/telegram";
import { storage } from "./storage";

// Bots may upload at most 50 MB per file. Every recording goes out as its own document,
// byte-for-byte (no ZIP: packing 20 MB costs ~400 ms CPU, far over the Workers Free 10 ms);
// a file larger than a part is cut into raw chunks (name.wav.001, .002, …) that 7-Zip or `cat`
// join back. Delivery runs in batches driven by the client, so each request stays small:
// few subrequests, little memory and CPU.

export type AudioFormat = "wav" | "mp3";

const MB = 1024 * 1024;

/** Part size: TELEGRAM_PART_MB or 45 MB, kept safely under the 50 MB bot limit. */
export function partLimitBytes() {
  const mb = Number(process.env.TELEGRAM_PART_MB);
  const wanted = Number.isFinite(mb) && mb > 0 ? mb * MB : 45 * MB;
  return Math.max(MB, Math.min(wanted, TELEGRAM_MAX_FILE_BYTES - 2 * MB));
}

/** Documents per request (TELEGRAM_BATCH, default 5). */
export function batchSize() {
  const n = Number(process.env.TELEGRAM_BATCH);
  return Number.isInteger(n) && n > 0 ? Math.min(n, 40) : 5;
}

interface Entry {
  record: number;
  format: AudioFormat;
  key: string;
  name: string;
  size: number;
}

type Delivery =
  | { kind: "index" }
  | { kind: "file"; entry: Entry }
  | { kind: "chunk"; entry: Entry; index: number; count: number; offset: number; length: number };

/** Deterministic for the same data, so a batch cursor points at the same item on every call. */
export function planDelivery(entries: Entry[], limit: number): Delivery[] {
  const plan: Delivery[] = [{ kind: "index" }];
  for (const e of entries) {
    if (e.size <= limit) {
      plan.push({ kind: "file", entry: e });
      continue;
    }
    const count = Math.ceil(e.size / limit);
    for (let i = 0; i < count; i++) {
      const offset = i * limit;
      plan.push({ kind: "chunk", entry: e, index: i + 1, count, offset, length: Math.min(limit, e.size - offset) });
    }
  }
  return plan;
}

const pad3 = (n: number) => String(n).padStart(3, "0");
const baseName = (path: string) => path.split("/").pop()!;
const chunkName = (file: string, i: number) => `${file}.${pad3(i)}`;

async function collectEntries(bundle: PersonBundle, formats: AudioFormat[]) {
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
  return entries;
}

/** Small ZIP (text only, cheap to deflate): metadata.json maps every recording to its documents. */
async function buildIndex(bundle: PersonBundle, formats: AudioFormat[], plan: Delivery[]) {
  const located = new Map<string, unknown>();
  for (const d of plan) {
    if (d.kind === "file") located.set(`${d.entry.record}:${d.entry.format}`, baseName(d.entry.name));
    if (d.kind === "chunk" && d.index === 1) {
      const file = baseName(d.entry.name);
      located.set(`${d.entry.record}:${d.entry.format}`, { file, chunks: Array.from({ length: d.count }, (_, k) => chunkName(file, k + 1)) });
    }
  }
  const zip = new JSZip();
  const metadata = bundle.voiceRecords.map((v, i) => {
    const files: Record<string, unknown> = {};
    for (const f of formats) if (located.has(`${i}:${f}`)) files[f] = located.get(`${i}:${f}`);
    return recordMeta(v, files);
  });
  zip.file("metadata.json", JSON.stringify(metadata, null, 2));
  for (const [i, v] of bundle.voiceRecords.entries()) if (v.transcription.trim()) zip.file(transcriptFileName(v, i), v.transcription);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

/**
 * Sends plan items [cursor, cursor + batch). Returns the next cursor (null when done)
 * and the plan length, so the client can show progress and call again.
 */
export async function sendAudioBatch(tg: TelegramClient, bundle: PersonBundle, formats: AudioFormat[], cursor: number) {
  const store = storage();
  const plan = planDelivery(await collectEntries(bundle, formats), partLimitBytes());
  const total = plan.length;
  const end = Math.min(total, cursor + batchSize());
  const label = formats.join(" + ").toUpperCase();

  for (let n = cursor; n < end; n++) {
    const d = plan[n];
    const counter = `${n + 1}/${total}`;
    if (d.kind === "index") {
      const name = `${archiveBaseName(bundle)}-audio-${formats.join("-")}-index.zip`;
      await tg.sendDocument(await buildIndex(bundle, formats, plan), name, `🎙 Аудио (${label}): опись и расшифровки, далее ${total - 1} файл(ов) · ${counter}`);
    } else if (d.kind === "file") {
      await tg.sendDocument(await store.get(d.entry.key), baseName(d.entry.name), `🎙 ${counter}`);
    } else {
      const file = baseName(d.entry.name);
      const data = await store.getRange(d.entry.key, d.offset, d.length);
      const hint =
        d.index === 1
          ? `\nФайл разбит на ${d.count} части. Соберите: 7-Zip → открыть ${file}.001, или <code>cat ${file}.0* &gt; ${file}</code>`
          : "";
      await tg.sendDocument(data, chunkName(file, d.index), `🎙 ${file} — кусок ${d.index} из ${d.count} · ${counter}${hint}`);
    }
  }
  return { sent: end - cursor, next: end < total ? end : null, total };
}
