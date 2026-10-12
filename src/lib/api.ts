import "server-only";
import { apiError } from "./auth";

type Ctx<P> = { params: Promise<P> };

/** Wraps a route handler: resolves params and maps thrown errors to JSON responses. */
export function route<P>(fn: (req: Request, params: P) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      return await fn(req, await ctx.params);
    } catch (e) {
      return apiError(e);
    }
  };
}
