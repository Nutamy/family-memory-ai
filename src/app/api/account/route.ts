import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, requireApiUserId } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/security/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { storage } from "@/lib/storage";

const DELETE_CONFIRMATION = "УДАЛИТЬ";

function signedOut(body: object) {
  const res = NextResponse.json(body);
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
}

/** "Sign out everywhere": every token issued so far stops matching User.sessionVersion. */
export const POST = route(async () => {
  const userId = await requireApiUserId();
  await db.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } });
  return signedOut({ ok: true });
});

const deleteSchema = z.object({ confirm: z.string().max(50), password: z.string().max(200).optional() });

/** Self-service deletion of the account with all archives and files. Irreversible. */
export const DELETE = route(async (req) => {
  const userId = await requireApiUserId();
  await rateLimit(`account-delete:${userId}`, { limit: 5, windowSec: 15 * 60 });
  const parsed = deleteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || parsed.data.confirm.trim().toUpperCase() !== DELETE_CONFIRMATION) {
    throw new HttpError(400, `Введите слово ${DELETE_CONFIRMATION} для подтверждения`);
  }
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  // A stolen session cookie alone must not be enough to wipe a password account.
  if (user.passwordHash && !(await verifyPassword(parsed.data.password ?? "", user.passwordHash))) {
    throw new HttpError(403, "Неверный пароль");
  }

  const persons = await db.person.findMany({ where: { userId }, select: { photoKey: true, voiceRecords: { select: { wavKey: true, mp3Key: true } } } });
  const keys = persons.flatMap((p) => [p.photoKey, ...p.voiceRecords.flatMap((r) => [r.wavKey, r.mp3Key])]).filter((k): k is string => !!k);
  // Files first: once the rows are gone nothing would point at them any more.
  for (let i = 0; i < keys.length; i += 20) {
    await Promise.all(keys.slice(i, i + 20).map((k) => storage().delete(k).catch(() => {})));
  }
  await db.user.delete({ where: { id: userId } });
  return signedOut({ ok: true });
});
