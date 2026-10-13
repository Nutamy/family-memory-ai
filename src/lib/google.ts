// "Sign in with Google": OAuth 2.0 authorization code flow with PKCE, verified OpenID id_token.
// Needs GOOGLE_CLIENT_ID (public) and GOOGLE_CLIENT_SECRET (secret); setup in docs/cloudflare.md.
import "server-only";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { authSecretKey } from "./session";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const OAUTH_COOKIE = "fm_oauth";
export const CALLBACK_PATH = "/api/auth/google/callback";

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export const isGoogleEnabled = () => googleConfig() !== null;

/** APP_URL pins the public origin when the app sits behind a proxy that rewrites Host. */
export function redirectUri(req: Request) {
  const origin = process.env.APP_URL?.trim().replace(/\/+$/, "") || new URL(req.url).origin;
  return `${origin}${CALLBACK_PATH}`;
}

/** Only same-site paths: an open redirect after sign-in would be a phishing aid. */
export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/app";
}

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const randomToken = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

/** Builds the Google consent URL and the signed cookie that binds state and PKCE verifier to this browser. */
export async function startGoogleSignIn(req: Request, next: string) {
  const cfg = googleConfig()!;
  const state = randomToken();
  const verifier = randomToken();
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));

  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const cookie = await new SignJWT({ state, verifier, next: safeNext(next) })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(authSecretKey());
  return { url: url.toString(), cookie };
}

export async function readOAuthCookie(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecretKey());
    return payload as { state: string; verifier: string; next: string };
  } catch {
    return null;
  }
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string | null;
}

/** Exchanges the code for tokens and verifies the id_token signature, issuer, audience and email. */
export async function finishGoogleSignIn(req: Request, code: string, verifier: string): Promise<GoogleIdentity> {
  const cfg = googleConfig()!;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: redirectUri(req),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  const json = (await res.json().catch(() => null)) as { id_token?: string; error?: string } | null;
  if (!res.ok || !json?.id_token) throw new Error(`Google token exchange failed: ${json?.error ?? res.status}`);

  const { payload } = await jwtVerify(json.id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: cfg.clientId,
  });
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  // An unverified email could belong to someone else — never link accounts by it.
  if (!payload.sub || !email || payload.email_verified !== true) throw new Error("Google account has no verified email");
  return { sub: payload.sub, email, name: typeof payload.name === "string" ? payload.name.slice(0, 100) : null };
}
