import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CALLBACK_PATH, finishGoogleSignIn, googleConfig, OAUTH_COOKIE, readOAuthCookie, type GoogleIdentity } from "@/lib/google";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

/**
 * Finds the user by Google id, then by verified email, else creates one.
 * Linking by email drops the password: registration does not verify emails, so a password set
 * by whoever registered the address first must not keep access once its owner proves it via Google.
 */
async function upsertGoogleUser(g: GoogleIdentity) {
  const byGoogle = await db.user.findFirst({ where: { provider: "google", providerId: g.sub } });
  if (byGoogle) return byGoogle;
  const byEmail = await db.user.findUnique({ where: { email: g.email } });
  if (byEmail) {
    return db.user.update({ where: { id: byEmail.id }, data: {
        provider: "google",
        providerId: g.sub,
        passwordHash: null,
        name: byEmail.name ?? g.name,
        // Also revoke sessions opened with that password.
        sessionVersion: { increment: 1 },
      },
    });
  }
  try {
    return await db.user.create({ data: { email: g.email, name: g.name, provider: "google", providerId: g.sub } });
  } catch {
    // Two callbacks raced on the unique email.
    return db.user.findUniqueOrThrow({ where: { email: g.email } });
  }
}

/** Step 2: Google redirects back with ?code&state. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${reason}`, url));
    res.cookies.set(OAUTH_COOKIE, "", { path: CALLBACK_PATH, maxAge: 0 });
    return res;
  };
  if (!googleConfig()) return fail("google_off");
  // The user pressed "Cancel" on Google's screen.
  if (url.searchParams.get("error")) return fail("google_cancel");

  const cookieHeader = req.headers.get("cookie") ?? "";
  const raw = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${OAUTH_COOKIE}=`))?.slice(OAUTH_COOKIE.length + 1);
  const saved = await readOAuthCookie(raw);
  const code = url.searchParams.get("code");
  // State ties the callback to the browser that started the flow (login CSRF protection).
  if (!saved || !code || url.searchParams.get("state") !== saved.state) return fail("google_state");

  try {
    await rateLimit(`google-ip:${clientIp(req)}`, { limit: 30, windowSec: 15 * 60 });
    const user = await upsertGoogleUser(await finishGoogleSignIn(req, code, saved.verifier));
    const res = NextResponse.redirect(new URL(saved.next, url));
    res.cookies.set(SESSION_COOKIE, await createSessionToken({ sub: user.id, email: user.email, sv: user.sessionVersion }), sessionCookieOptions);
    res.cookies.set(OAUTH_COOKIE, "", { path: CALLBACK_PATH, maxAge: 0 });
    return res;
  } catch (e) {
    console.error(e instanceof Error ? `${e.name}: ${e.message}` : e);
    return fail("google_failed");
  }
}
