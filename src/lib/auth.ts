// Server-side auth helpers. Two modes:
// - Cloudflare Access (src/lib/access.ts): identity comes from the signed Access JWT;
// - email + password (bcrypt) with our own session cookie — local development and Node hosting.
// OAuth providers (Google, Microsoft, Apple) plug in via User.provider/providerId:
// add a callback route that upserts the User and calls createSessionToken — the rest
// of the app only relies on the session cookie.
import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { cache } from "react";
import { ACCESS_COOKIE, accessTokenFrom, isAccessMode, verifyAccessToken } from "./access";
import { db } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** Access users are created on first visit: Access has already confirmed the email. */
async function userIdForAccessEmail(email: string, sub: string) {
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return existing.id;
  try {
    return (await db.user.create({ data: { email, provider: "cloudflare-access", providerId: sub }, select: { id: true } })).id;
  } catch {
    // Two first requests raced on the unique email.
    return (await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } })).id;
  }
}

// cache(): layout and page of one render share a single verification.
export const getSessionUserId = cache(async (): Promise<string | null> => {
  const store = await cookies();
  if (isAccessMode()) {
    const identity = await verifyAccessToken(accessTokenFrom(await headers(), store.get(ACCESS_COOKIE)?.value));
    return identity ? userIdForAccessEmail(identity.email, identity.sub) : null;
  }
  const session = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  return session?.sub ?? null;
});

export async function getCurrentUser() {
  const id = await getSessionUserId();
  if (!id) return null;
  return db.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages: returns the person or redirects when it doesn't belong to the user. */
export async function requirePerson(personId: string) {
  const user = await requireUser();
  const person = await db.person.findFirst({ where: { id: personId, userId: user.id } });
  if (!person) redirect("/app");
  return { user, person };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** For API routes: throws HttpError on missing session / foreign person. */
export async function assertPersonAccess(personId: string) {
  const userId = await getSessionUserId();
  if (!userId) throw new HttpError(401, "Требуется вход");
  const person = await db.person.findFirst({ where: { id: personId, userId } });
  if (!person) throw new HttpError(404, "Профиль не найден");
  return person;
}

export function apiError(err: unknown) {
  if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error(err);
  return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
}
