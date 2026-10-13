import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { toVoiceDTO } from "@/lib/dto";
import { getTranscriptionProvider } from "@/lib/integrations";
import { rateLimit } from "@/lib/security/rate-limit";
import { storage } from "@/lib/storage";

export const POST = route<{ id: string; vid: string }>(async (_req, { id, vid }) => {
  const person = await assertPersonAccess(id);
  // Paid external API — bound the cost per account.
  await rateLimit(`transcribe:${person.userId}`, { limit: 30, windowSec: 60 * 60 });
  const r = await db.voiceRecord.findFirst({ where: { id: vid, personId: id } });
  if (!r) throw new HttpError(404, "Запись не найдена");
  const provider = getTranscriptionProvider();
  if (!provider) throw new HttpError(501, "Автоматическая расшифровка пока не подключена");
  const key = r.mp3Key ?? r.wavKey;
  const text = await provider.transcribe(await storage().get(key), key.split("/").pop()!);
  const updated = await db.voiceRecord.update({ where: { id: vid }, data: { transcription: text } });
  return NextResponse.json(toVoiceDTO(updated));
});
