// Cloudflare Access (Zero Trust) sign-in. Edge-safe: used by middleware and route handlers.
// When CF_ACCESS_TEAM_DOMAIN is set (CF_ACCESS_AUD recommended), Access in front of the site checks the
// email (one-time code), and the app only verifies the signed JWT Access attaches to every request.
// No passwords are hashed, which keeps requests within the Workers Free CPU limit.
import { createRemoteJWKSet, jwtVerify } from "jose";

export const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";
export const ACCESS_COOKIE = "CF_Authorization";
/** Ends the Access session on the app's own hostname. */
export const ACCESS_LOGOUT_PATH = "/cdn-cgi/access/logout";

export function accessConfig() {
  const team = process.env.CF_ACCESS_TEAM_DOMAIN?.trim().replace(/\/+$/, "");
  if (!team) return null;
  // Without AUD any application of this team is accepted; with it, only this site's tokens.
  const aud = process.env.CF_ACCESS_AUD?.trim() || undefined;
  // "family.cloudflareaccess.com" → https; an explicit scheme is kept (local tests).
  return { issuer: team.includes("://") ? team : `https://${team}`, aud };
}

export const isAccessMode = () => accessConfig() !== null;

// One key set per isolate: jose caches the keys and refetches on rotation.
let jwks: { issuer: string; set: ReturnType<typeof createRemoteJWKSet> } | null = null;

/** Returns the verified email, or null for a missing/forged/expired token. */
export async function verifyAccessToken(token: string | null | undefined): Promise<{ email: string; sub: string } | null> {
  const cfg = accessConfig();
  if (!cfg || !token) return null;
  if (jwks?.issuer !== cfg.issuer) {
    jwks = { issuer: cfg.issuer, set: createRemoteJWKSet(new URL(`${cfg.issuer}/cdn-cgi/access/certs`)) };
  }
  try {
    const { payload } = await jwtVerify(token, jwks.set, { issuer: cfg.issuer, audience: cfg.aud, algorithms: ["RS256"] });
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    return email && payload.sub ? { email, sub: payload.sub } : null;
  } catch {
    return null;
  }
}

/** Access sends the JWT as a header to the origin; the cookie is the fallback. */
export function accessTokenFrom(headers: Headers, cookie?: string) {
  return headers.get(ACCESS_JWT_HEADER) || cookie || null;
}
