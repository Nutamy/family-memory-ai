import { NextResponse } from "next/server";
import { HttpError } from "@/lib/auth";
import { authMode } from "@/lib/auth-mode";
import { route } from "@/lib/api";
import { createGuestUser } from "@/lib/guest";
import { guardPublicForm } from "@/lib/security/form-guard";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

/** "Начать": creates an anonymous account and signs the browser in. */
export const POST = route(async (req) => {
  if (authMode() !== "guest") throw new HttpError(404, "Недоступно");
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  // Public endpoint that creates rows: cap per IP and keep bots out.
  await rateLimit(`guest-ip:${clientIp(req)}`, { limit: 20, windowSec: 60 * 60 });
  await guardPublicForm(req, body);

  const user = await createGuestUser();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken({ sub: user.id, email: user.email }), sessionCookieOptions);
  return res;
});
