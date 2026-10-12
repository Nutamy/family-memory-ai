import { NextResponse } from "next/server";
import { z } from "zod";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { FAVORITE_KINDS } from "@/lib/questionnaire";

const schema = z.object({
  kind: z.enum(FAVORITE_KINDS.map((k) => k.kind) as [string, ...string[]]),
  title: z.string().trim().min(1, "Заполните название").max(1000),
  note: z.string().trim().max(20_000).default(""),
});

export const POST = route<{ id: string }>(async (req, { id }) => {
  await assertPersonAccess(id);
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
  const item = await db.favoriteItem.create({ data: { ...parsed.data, personId: id } });
  return NextResponse.json({ id: item.id, kind: item.kind, title: item.title, note: item.note }, { status: 201 });
});
