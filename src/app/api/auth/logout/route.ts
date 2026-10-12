import { NextResponse } from "next/server";
import { ACCESS_LOGOUT_PATH, isAccessMode } from "@/lib/access";
import { route } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

/** Clears the app session; under Access the client must also visit the Access logout URL. */
export const POST = route(async () => {
  const res = NextResponse.json({ ok: true, redirect: isAccessMode() ? ACCESS_LOGOUT_PATH : "/" });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
});
