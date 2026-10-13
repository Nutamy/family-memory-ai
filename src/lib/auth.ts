// Server-side auth helpers. Sign-in methods (email + password, Google) all end in the same
// signed session cookie (src/lib/session.ts); the rest of the app only relies on that cookie.
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./session";

// cache(): layout and page of one render share a single verification.
export const getSessionUserId = cache(async (): Promise<string | null> => {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
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
  // First line carries the cause (e.g. Prisma "no such table"), so it shows in the Workers log list.
  console.error(err instanceof Error ? `${err.name}: ${err.message.trim()}` : err);
  return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
}
