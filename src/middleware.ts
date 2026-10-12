import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  // API routes authorize themselves (see assertPersonAccess); middleware is kept off
  // them so large audio uploads are not buffered here.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/app/:path*"] };
