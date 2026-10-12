import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken({ sub: user.id, email }), sessionCookieOptions);
  return res;
}
