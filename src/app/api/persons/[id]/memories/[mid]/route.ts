import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { memoryInclude, memorySchema, pruneTags, resolveTags, toMemoryDTO } from "@/lib/memories";

async function own(personId: string, mid: string) {
  await assertPersonAccess(personId);
  const m = await db.memory.findFirst({ where: { id: mid, personId } });
  if (!m) throw new HttpError(404, "Воспоминание не найдено");
}

export const PATCH = route<{ id: string; mid: string }>(async (req, { id, mid }) => {
  await own(id, mid);
  const parsed = memorySchema.partial().safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
  const { tags, ...data } = parsed.data;
  const memory = await db.memory.update({
    where: { id: mid },
    data: { ...data, ...(tags && { tags: { set: await resolveTags(id, tags) } }) },
    include: memoryInclude,
  });
  await pruneTags(id);
  return NextResponse.json(toMemoryDTO(memory));
});

export const DELETE = route<{ id: string; mid: string }>(async (_req, { id, mid }) => {
  await own(id, mid);
  await db.memory.delete({ where: { id: mid } });
  await pruneTags(id);
  return NextResponse.json({ ok: true });
});
