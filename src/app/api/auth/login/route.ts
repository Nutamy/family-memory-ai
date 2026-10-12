import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { guardPublicForm } from "@/lib/security/form-guard";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

// Compared against when the email is unknown, so response time does not reveal registered emails.
let dummyHash: Promise<string> | null = null;

export const POST = route(async (req) => {
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(body.password ?? "");

  // Per IP against credential stuffing, per email against targeted guessing.
  await rateLimit(`login-ip:${clientIp(req)}`, { limit: 20, windowSec: 15 * 60 });
  if (email) await rateLimit(`login-email:${email}`, { limit: 8, windowSec: 15 * 60 });
  await guardPublicForm(req, body);

  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  const hash = user?.passwordHash ?? (await (dummyHash ??= bcrypt.hash("timing-equalizer", 10)));
  const ok = password.length <= 200 && (await bcrypt.compare(password, hash));
  if (!user?.passwordHash || !ok) throw new HttpError(401, "Неверный email или пароль");

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken({ sub: user.id, email }), sessionCookieOptions);
  return res;
});
