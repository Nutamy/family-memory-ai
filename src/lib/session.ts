// Edge-safe session helpers (used by middleware and route handlers).
import { SignJWT, jwtVerify } from "jose";

const isProd = process.env.NODE_ENV === "production";

// __Host- prefix: the browser accepts the cookie only with Secure, Path=/ and no Domain,
// so a sibling subdomain can neither set nor overwrite it. Plain HTTP on localhost can't use it.
export const SESSION_COOKIE = isProd ? "__Host-fm_session" : "fm_session";
const MAX_AGE = 60 * 60 * 24 * 14;
const ISSUER = "family-memory";
// Separates session tokens from other JWTs signed with the same secret (e.g. the OAuth state cookie).
const AUDIENCE = "session";

export function authSecretKey() {
  const s = process.env.AUTH_SECRET;
  if (isProd && (!s || s.length < 32)) throw new Error("AUTH_SECRET is not set or shorter than 32 characters");
  return new TextEncoder().encode(s || "dev-insecure-secret-change-me");
}

export interface SessionPayload {
  sub: string;
  email: string;
  /** User.sessionVersion at sign-in; bumping it in the DB revokes every issued token. */
  sv: number;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, sv: payload.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(authSecretKey());
}

/** Signature and expiry only; the revocation check against the DB lives in getSessionUserId (src/lib/auth.ts). */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token || token.length > 4096) return null;
  try {
    const { payload } = await jwtVerify(token, authSecretKey(), { algorithms: ["HS256"], issuer: ISSUER, audience: AUDIENCE });
    if (!payload.sub || typeof payload.sv !== "number") return null;
    return { sub: payload.sub, email: String(payload.email ?? ""), sv: payload.sv };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
  maxAge: MAX_AGE,
};
