import { NextResponse } from "next/server";
import { z } from "zod";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { MODULES } from "@/lib/questionnaire";
import { storage } from "@/lib/storage";

const s = z.string().trim().max(5000);
const patchSchema = z
  .object({
    firstName: z.string().trim().min(1, "Имя не может быть пустым").max(100),
    lastName: s,
    middleName: s,
    birthDate: s,
    birthPlace: s,
    residence: s,
    education: s,
    profession: s,
    bio: z.string().max(20000),
    lastSection: z.enum(MODULES.map((m) => m.slug) as [string, ...string[]]),
  })
  .partial();

export const GET = route<{ id: string }>(async (_req, { id }) => NextResponse.json(await assertPersonAccess(id)));

export const PATCH = route<{ id: string }>(async (req, { id }) => {
  await assertPersonAccess(id);
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
  const person = await db.person.update({ where: { id }, data: parsed.data });
  return NextResponse.json(person);
});

export const DELETE = route<{ id: string }>(async (_req, { id }) => {
  const person = await assertPersonAccess(id);
  const records = await db.voiceRecord.findMany({ where: { personId: id } });
  const keys = records.flatMap((r) => [r.wavKey, r.mp3Key]).concat(person.photoKey);
  await Promise.all(keys.filter((k): k is string => !!k).map((k) => storage().delete(k).catch(() => {})));
  await db.person.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
