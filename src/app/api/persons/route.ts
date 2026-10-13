import { NextResponse } from "next/server";
import { HttpError, requireApiUserId as userId } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { personCreateSchema } from "@/lib/schemas";
import { assertPersonQuota } from "@/lib/security/quota";
import { rateLimit } from "@/lib/security/rate-limit";

export const GET = route(async () => {
  const persons = await db.person.findMany({ where: { userId: await userId() }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(persons);
});

export const POST = route(async (req) => {
  const uid = await userId();
  await rateLimit(`person-create:${uid}`, { limit: 20, windowSec: 60 * 60 });
  await assertPersonQuota(uid);
  const parsed = personCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
  const person = await db.person.create({ data: { ...parsed.data, userId: uid, lastSection: "basic" } });
  return NextResponse.json(person, { status: 201 });
});
