import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { memoryInclude, memorySchema, resolveTags, toMemoryDTO } from "@/lib/memories";

export const GET = route<{ id: string }>(async (_req, { id }) => {
  await assertPersonAccess(id);
  const memories = await db.memory.findMany({ where: { personId: id }, include: memoryInclude, orderBy: { createdAt: "desc" } });
  return NextResponse.json(memories.map(toMemoryDTO));
});

export const POST = route<{ id: string }>(async (req, { id }) => {
  await assertPersonAccess(id);
  const parsed = memorySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
  const { tags, ...data } = parsed.data;
  const memory = await db.memory.create({
    data: { ...data, personId: id, tags: { connect: await resolveTags(id, tags) } },
    include: memoryInclude,
  });
  return NextResponse.json(toMemoryDTO(memory), { status: 201 });
});
