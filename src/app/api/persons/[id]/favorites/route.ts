import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { favoriteSchema } from "@/lib/schemas";
import { assertItemQuota } from "@/lib/security/quota";

export const POST = route<{ id: string }>(async (req, { id }) => {
  await assertPersonAccess(id);
  await assertItemQuota("favorites", id);
  const parsed = favoriteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
  const item = await db.favoriteItem.create({ data: { ...parsed.data, personId: id } });
  return NextResponse.json({ id: item.id, kind: item.kind, title: item.title, note: item.note }, { status: 201 });
});
