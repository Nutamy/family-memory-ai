import "server-only";
import JSZip from "jszip";
import type { PersonBundle } from "./data";
import { audioFileName, buildProfileJson } from "./export";
import { buildPersonaPrompt } from "./integrations/persona";
import { buildReport } from "./report";
import { storage } from "./storage";
import { formatDuration, slugifyFile } from "./utils";

/**
 * Builds the export archive.
 * audio — all recordings (WAV + MP3) with metadata and transcripts, ready for ElevenLabs.
 * full  — the above plus profile.json, persona prompt and photo.
 * formats — limit audio formats (Telegram delivery uses MP3 only to stay under 50 MB).
 */
export async function buildArchiveZip(bundle: PersonBundle, opts: { full: boolean; formats?: ("wav" | "mp3")[] }) {
  const formats = opts.formats ?? ["wav", "mp3"];
  const zip = new JSZip();
  const meta = [];
  for (const [i, v] of bundle.voiceRecords.entries()) {
    const files: Record<string, string> = {};
    for (const [fmt, key] of [
      ["wav", v.wavKey],
      ["mp3", v.mp3Key],
    ] as const) {
      if (!key || !formats.includes(fmt)) continue;
      try {
        const name = audioFileName(v, i, fmt);
        zip.file(name, await storage().get(key));
        files[fmt] = name;
      } catch {
        // Missing file on disk — keep exporting the rest.
      }
    }
    if (v.transcription.trim()) zip.file(`transcripts/${String(i + 1).padStart(3, "0")}-${slugifyFile(v.title)}.txt`, v.transcription);
    meta.push({ title: v.title, topic: v.topic, duration: formatDuration(v.duration), seconds: v.duration, sampleRate: v.sampleRate, files });
  }
  zip.file("audio/metadata.json", JSON.stringify(meta, null, 2));

  if (opts.full) {
    zip.file("profile.json", JSON.stringify(buildProfileJson(bundle), null, 2));
    zip.file("persona-prompt.md", buildPersonaPrompt(bundle, buildReport(bundle)));
    if (bundle.photoKey) {
      try {
        zip.file(`photo.${bundle.photoKey.split(".").pop()}`, await storage().get(bundle.photoKey));
      } catch {}
    }
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 4 } });
}

export function archiveBaseName(bundle: PersonBundle) {
  return slugifyFile(`${bundle.firstName} ${bundle.lastName}`);
}
