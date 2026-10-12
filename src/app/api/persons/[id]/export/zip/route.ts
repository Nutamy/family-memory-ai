import JSZip from "jszip";
import { assertPersonAccess } from "@/lib/auth";
import { route } from "@/lib/api";
import { loadPersonBundle } from "@/lib/data";
import { audioFileName, buildProfileJson } from "@/lib/export";
import { buildPersonaPrompt } from "@/lib/integrations/persona";
import { buildReport } from "@/lib/report";
import { storage } from "@/lib/storage";
import { formatDuration, slugifyFile } from "@/lib/utils";

/**
 * ?type=audio — all recordings (WAV + MP3) with metadata and transcripts, ready for ElevenLabs.
 * ?type=full  — the above plus profile.json, persona prompt and photo.
 */
export const GET = route<{ id: string }>(async (req, { id }) => {
  await assertPersonAccess(id);
  const full = new URL(req.url).searchParams.get("type") === "full";
  const bundle = await loadPersonBundle(id);
  const zip = new JSZip();

  const meta = [];
  for (const [i, v] of bundle.voiceRecords.entries()) {
    const files: Record<string, string> = {};
    for (const [fmt, key] of [
      ["wav", v.wavKey],
      ["mp3", v.mp3Key],
    ] as const) {
      if (!key) continue;
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

  if (full) {
    zip.file("profile.json", JSON.stringify(buildProfileJson(bundle), null, 2));
    zip.file("persona-prompt.md", buildPersonaPrompt(bundle, buildReport(bundle)));
    if (bundle.photoKey) {
      try {
        zip.file(`photo.${bundle.photoKey.split(".").pop()}`, await storage().get(bundle.photoKey));
      } catch {}
    }
  }

  const data = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 4 } });
  const base = slugifyFile(`${bundle.firstName} ${bundle.lastName}`);
  const name = `${base}-${full ? "archive" : "audio"}.zip`;
  return new Response(data as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${full ? "archive" : "audio"}.zip"; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
});
