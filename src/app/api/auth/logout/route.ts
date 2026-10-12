import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const POST = route(async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
});
