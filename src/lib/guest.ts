import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { GUEST_EMAIL_DOMAIN } from "./auth-mode";
import { db } from "./db";
import { sessionSecret } from "./session";

const RESUME_DAYS = 365;

const randomId = (bytes = 12) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("");

export async function createGuestUser() {
  return db.user.create({ data: { email: `guest-${randomId()}@${GUEST_EMAIL_DOMAIN}`, provider: "guest" }, select: { id: true, email: true } });
}

/**
 * Long-lived link the bot sends to the person: opening it restores the session on any
 * device. It is a bearer credential, so it only ever goes to the person's own chat.
 */
export async function resumeUrl(origin: string, userId: string) {
  const token = await new SignJWT({ purpose: "resume" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${RESUME_DAYS}d`)
    .sign(sessionSecret());
  return `${origin}/resume?t=${token}`;
}

export async function verifyResumeToken(token: string | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"] });
    return payload.purpose === "resume" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
