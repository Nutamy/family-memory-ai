import { NextResponse } from "next/server";
import { CALLBACK_PATH, googleConfig, OAUTH_COOKIE, startGoogleSignIn } from "@/lib/google";

/** Step 1: send the browser to Google's consent screen. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!googleConfig()) return NextResponse.redirect(new URL("/login?error=google_off", url));
  const { url: target, cookie } = await startGoogleSignIn(req, url.searchParams.get("next") ?? "/app");
  const res = NextResponse.redirect(target);
  // Lax: Google returns with a top-level GET, which carries Lax cookies.
  res.cookies.set(OAUTH_COOKIE, cookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: CALLBACK_PATH,
    maxAge: 600,
  });
  return res;
}
