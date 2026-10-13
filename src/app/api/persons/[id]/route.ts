import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { personPatchSchema } from "@/lib/schemas";
import { storage } from "@/lib/storage";

export const GET = route<{ id: string }>(async (_req, { id }) => NextResponse.json(await assertPersonAccess(id)));

export const PATCH = route<{ id: string }>(async (req, { id }) => {
  await assertPersonAccess(id);
  const parsed = personPatchSchema.safeParse(await req.json().catch(() => ({})));
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
