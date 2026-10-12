import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { cloudflareContext } from "./cloudflare";

// Node: one SQLite client, reused across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Workers: I/O objects must not be shared between requests, so a D1-backed client is
// created per request and keyed by its ExecutionContext.
const perRequest = new WeakMap<object, PrismaClient>();

function client(): PrismaClient {
  const cf = cloudflareContext();
  if (cf?.env.DB) {
    let c = perRequest.get(cf.ctx);
    if (!c) {
      c = new PrismaClient({ adapter: new PrismaD1(cf.env.DB) });
      perRequest.set(cf.ctx, c);
    }
    return c;
  }
  globalForPrisma.prisma ??= new PrismaClient();
  return globalForPrisma.prisma;
}

/** Resolves to the right client on every access, so call sites stay `db.user.findMany(...)`. */
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const c = client();
    const value = Reflect.get(c, prop);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
