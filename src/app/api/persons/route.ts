import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";

async function userId() {
  const id = await getSessionUserId();
  if (!id) throw new HttpError(401, "Требуется вход");
  return id;
}

export const GET = route(async () => {
  const persons = await db.person.findMany({ where: { userId: await userId() }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(persons);
});

const createSchema = z.object({
  firstName: z.string().trim().min(1, "Укажите имя").max(100),
  lastName: z.string().trim().max(100).default(""),
  middleName: z.string().trim().max(100).default(""),
});

export const POST = route(async (req) => {
  const uid = await userId();
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
  const person = await db.person.create({ data: { ...parsed.data, userId: uid, lastSection: "basic" } });
  return NextResponse.json(person, { status: 201 });
});
