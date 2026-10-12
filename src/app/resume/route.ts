import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyResumeToken } from "@/lib/guest";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

/** "Продолжить заполнение" link from the bot: restores the session on this device. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  try {
    await rateLimit(`resume-ip:${clientIp(req)}`, { limit: 30, windowSec: 15 * 60 });
  } catch {
    return NextResponse.redirect(new URL("/login?expired=1", url));
  }
  const userId = await verifyResumeToken(url.searchParams.get("t"));
  const user = userId ? await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true } }) : null;
  if (!user) return NextResponse.redirect(new URL("/login?expired=1", url));

  const res = NextResponse.redirect(new URL("/continue", url));
  res.cookies.set(SESSION_COOKIE, await createSessionToken({ sub: user.id, email: user.email }), sessionCookieOptions);
  // Keep the token out of browser history and Referer headers.
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
