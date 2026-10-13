import "server-only";
import { apiError } from "./auth";
import { assertSameOrigin } from "./security/origin";
import { clientIp, rateLimit } from "./security/rate-limit";

type Ctx<P> = { params: Promise<P> };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Personal data must never land in a shared or browser cache, nor in search engines. */
function harden(res: Response) {
  const h = res.headers;
  if (!h.has("Cache-Control")) h.set("Cache-Control", "private, no-store");
  h.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

/** Wraps a route handler: CSRF check, write throttling, resolves params and maps thrown errors to JSON responses. */
export function route<P = Record<string, never>>(fn: (req: Request, params: P) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      assertSameOrigin(req);
      // Coarse ceiling for any mutation from one address (autosave included); finer limits live in the routes.
      if (!SAFE_METHODS.has(req.method)) await rateLimit(`write-ip:${clientIp(req)}`, { limit: 1200, windowSec: 600 });
      return harden(await fn(req, ((await ctx?.params) ?? {}) as P));
    } catch (e) {
      return harden(apiError(e));
    }
  };
}
