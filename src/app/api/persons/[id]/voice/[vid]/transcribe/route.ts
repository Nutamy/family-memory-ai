import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { toVoiceDTO } from "@/lib/dto";
import { getTranscriptionProvider } from "@/lib/integrations";
import { storage } from "@/lib/storage";

export const POST = route<{ id: string; vid: string }>(async (_req, { id, vid }) => {
  await assertPersonAccess(id);
  const r = await db.voiceRecord.findFirst({ where: { id: vid, personId: id } });
  if (!r) throw new HttpError(404, "Запись не найдена");
  const provider = getTranscriptionProvider();
  if (!provider) throw new HttpError(501, "Расшифровка не настроена: добавьте OPENAI_API_KEY в .env");
  const key = r.mp3Key ?? r.wavKey;
  const text = await provider.transcribe(await storage().get(key), key.split("/").pop()!);
  const updated = await db.voiceRecord.update({ where: { id: vid }, data: { transcription: text } });
  return NextResponse.json(toVoiceDTO(updated));
});
