import { NextResponse } from "next/server";
import { getSessionUserId, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { personCreateSchema } from "@/lib/schemas";

async function userId() {
  const id = await getSessionUserId();
  if (!id) throw new HttpError(401, "Требуется вход");
  return id;
}

export const GET = route(async () => {
  const persons = await db.person.findMany({ where: { userId: await userId() }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(persons);
});

export const POST = route(async (req) => {
  const uid = await userId();
  const parsed = personCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
  const person = await db.person.create({ data: { ...parsed.data, userId: uid, lastSection: "basic" } });
  return NextResponse.json(person, { status: 201 });
});
