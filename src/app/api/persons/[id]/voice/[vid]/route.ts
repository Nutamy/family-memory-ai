import { NextResponse } from "next/server";
import { z } from "zod";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { toVoiceDTO } from "@/lib/dto";
import { storage } from "@/lib/storage";
import { slugifyFile } from "@/lib/utils";

async function own(personId: string, vid: string) {
  await assertPersonAccess(personId);
  const r = await db.voiceRecord.findFirst({ where: { id: vid, personId } });
  if (!r) throw new HttpError(404, "Запись не найдена");
  return r;
}

/** Streams the audio. ?format=wav|mp3, ?download=1 for an attachment. Supports Range for seeking. */
export const GET = route<{ id: string; vid: string }>(async (req, { id, vid }) => {
  const r = await own(id, vid);
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "mp3" && r.mp3Key ? "mp3" : "wav";
  const key = format === "mp3" ? r.mp3Key! : r.wavKey;
  const data = await storage().get(key);
  const type = format === "mp3" ? "audio/mpeg" : "audio/wav";
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600" };
  if (url.searchParams.get("download")) {
    const name = `${slugifyFile(r.title)}.${format}`;
    headers["Content-Disposition"] = `attachment; filename="record.${format}"; filename*=UTF-8''${encodeURIComponent(name)}`;
  }

  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
    if (start >= data.length || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${data.length}` } });
    }
    return new Response(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${data.length}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Length": String(data.length) } });
});

const patchSchema = z
  .object({ title: z.string().trim().min(1).max(300), topic: z.string().trim().max(100), transcription: z.string().max(200_000) })
  .partial();

export const PATCH = route<{ id: string; vid: string }>(async (req, { id, vid }) => {
  await own(id, vid);
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, "Некорректные данные");
  const r = await db.voiceRecord.update({ where: { id: vid }, data: parsed.data });
  return NextResponse.json(toVoiceDTO(r));
});

export const DELETE = route<{ id: string; vid: string }>(async (_req, { id, vid }) => {
  const r = await own(id, vid);
  await db.voiceRecord.delete({ where: { id: vid } });
  await Promise.all([r.wavKey, r.mp3Key].filter((k): k is string => !!k).map((k) => storage().delete(k).catch(() => {})));
  // If this was an answer's primary audio, fall back to the previous recording of that question.
  if (r.questionId) {
    const prev = await db.voiceRecord.findFirst({ where: { personId: id, questionId: r.questionId }, orderBy: { createdAt: "desc" } });
    if (prev) {
      await db.answer.updateMany({ where: { personId: id, questionId: r.questionId, voiceRecordId: null }, data: { voiceRecordId: prev.id } });
    }
  }
  return NextResponse.json({ ok: true });
});
