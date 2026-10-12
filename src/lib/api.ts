import "server-only";
import { apiError } from "./auth";
import { assertSameOrigin } from "./security/origin";

type Ctx<P> = { params: Promise<P> };

/** Wraps a route handler: CSRF check, resolves params and maps thrown errors to JSON responses. */
export function route<P = Record<string, never>>(fn: (req: Request, params: P) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      assertSameOrigin(req);
      return await fn(req, ((await ctx?.params) ?? {}) as P);
    } catch (e) {
      return apiError(e);
    }
  };
}
