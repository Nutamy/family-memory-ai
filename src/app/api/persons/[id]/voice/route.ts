import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { toVoiceDTO } from "@/lib/dto";
import { getQuestion } from "@/lib/questionnaire";
import { storage } from "@/lib/storage";

const MAX_BYTES = 300 * 1024 * 1024;

export const GET = route<{ id: string }>(async (_req, { id }) => {
  await assertPersonAccess(id);
  const records = await db.voiceRecord.findMany({ where: { personId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(records.map(toVoiceDTO));
});

/** Multipart upload: wav (required), mp3 (optional) + metadata measured in the browser. */
export const POST = route<{ id: string }>(async (req, { id }) => {
  await assertPersonAccess(id);
  const form = await req.formData();
  const wav = form.get("wav");
  const mp3 = form.get("mp3");
  if (!(wav instanceof File) || wav.size < 44) throw new HttpError(400, "Нет аудиофайла");
  if (wav.size > MAX_BYTES) throw new HttpError(413, "Запись слишком большая");

  const num = (k: string) => {
    const n = Number(form.get(k));
    return Number.isFinite(n) ? n : 0;
  };
  const str = (k: string) => String(form.get(k) ?? "").trim();

  const questionId = str("questionId") || null;
  if (questionId && !getQuestion(questionId)) throw new HttpError(400, "Неизвестный вопрос");
  const memoryId = str("memoryId") || null;
  if (memoryId && !(await db.memory.findFirst({ where: { id: memoryId, personId: id } }))) {
    throw new HttpError(400, "Воспоминание не найдено");
  }

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const wavKey = `persons/${id}/audio/${stamp}.wav`;
  await storage().put(wavKey, Buffer.from(await wav.arrayBuffer()), "audio/wav");
  let mp3Key: string | null = null;
  if (mp3 instanceof File && mp3.size > 0) {
    mp3Key = `persons/${id}/audio/${stamp}.mp3`;
    await storage().put(mp3Key, Buffer.from(await mp3.arrayBuffer()), "audio/mpeg");
  }

  const record = await db.voiceRecord.create({
    data: {
      personId: id,
      questionId,
      memoryId,
      title: str("title").slice(0, 300) || "Голосовая запись",
      topic: str("topic").slice(0, 100),
      wavKey,
      mp3Key,
      duration: num("duration"),
      sampleRate: Math.round(num("sampleRate")),
      sizeBytes: wav.size,
      peakDb: num("peakDb"),
      rmsDb: num("rmsDb"),
      clipping: num("clipping"),
    },
  });

  // The newest recording becomes the answer's primary audio.
  if (questionId) {
    await db.answer.upsert({
      where: { personId_questionId: { personId: id, questionId } },
      create: { personId: id, questionId, voiceRecordId: record.id },
      update: { voiceRecordId: record.id },
    });
  }
  await db.person.update({ where: { id }, data: { updatedAt: new Date() } });
  return NextResponse.json(toVoiceDTO(record), { status: 201 });
});
