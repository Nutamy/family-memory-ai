// Bindings declared in wrangler.jsonc. Kept by hand instead of `wrangler types`, whose
// runtime typings replace DOM fetch types across the whole app.
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

export {};
