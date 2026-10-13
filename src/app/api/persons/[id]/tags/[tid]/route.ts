import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { tagPatchSchema } from "@/lib/schemas";

export const PATCH = route<{ id: string; tid: string }>(async (req, { id, tid }) => {
  await assertPersonAccess(id);
  const parsed = tagPatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, "Некорректные данные");
  const res = await db.tag.updateMany({ where: { id: tid, personId: id }, data: parsed.data });
  if (!res.count) throw new HttpError(404, "Тег не найден");
  return NextResponse.json({ ok: true });
});

export const DELETE = route<{ id: string; tid: string }>(async (_req, { id, tid }) => {
  await assertPersonAccess(id);
  await db.tag.deleteMany({ where: { id: tid, personId: id } });
  return NextResponse.json({ ok: true });
});
