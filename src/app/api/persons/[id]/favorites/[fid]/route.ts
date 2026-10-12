import { NextResponse } from "next/server";
import { assertPersonAccess } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";

export const DELETE = route<{ id: string; fid: string }>(async (_req, { id, fid }) => {
  await assertPersonAccess(id);
  await db.favoriteItem.deleteMany({ where: { id: fid, personId: id } });
  return NextResponse.json({ ok: true });
});
