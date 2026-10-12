import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { moduleHref } from "@/lib/questionnaire";

// "Продолжить заполнение": jump to the last opened section of the most recent profile.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.redirect(new URL("/login?next=/continue", url));
  const person = await db.person.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
  if (!person) return NextResponse.redirect(new URL("/app/new", url));
  const target = person.lastSection ? moduleHref(person.id, person.lastSection) : `/app/p/${person.id}`;
  return NextResponse.redirect(new URL(target, url));
}
