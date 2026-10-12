import { HttpError } from "../auth";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF guard for cookie-authenticated mutations. SameSite=Lax already blocks most
 * cross-site POSTs; this also rejects same-site subdomains and old browsers.
 * Requests without Origin/Sec-Fetch-Site are not from a browser and carry no ambient cookies.
 */
export function assertSameOrigin(req: Request) {
  if (SAFE_METHODS.has(req.method)) return;
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new HttpError(403, "Запрос с чужого сайта отклонён");

  const origin = req.headers.get("origin");
  if (!origin) return;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    throw new HttpError(403, "Некорректный Origin");
  }
  const allowed = new Set(
    [new URL(req.url).host, req.headers.get("x-forwarded-host"), req.headers.get("host"), ...(process.env.APP_ORIGINS ?? "").split(",")]
      .map((h) => h?.trim().replace(/^https?:\/\//, ""))
      .filter(Boolean),
  );
  if (!allowed.has(host)) throw new HttpError(403, "Запрос с чужого сайта отклонён");
}
