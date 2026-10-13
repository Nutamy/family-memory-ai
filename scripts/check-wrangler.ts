// Fails a Cloudflare Git build early when wrangler.jsonc lost the production D1 id, instead of
// letting `wrangler deploy` fail after a full build. Skipped locally: forks may have no database yet.
import { readFileSync } from "fs";

if (process.env.WORKERS_CI) {
  const id = readFileSync("wrangler.jsonc", "utf8").match(/"database_id"\s*:\s*"([^"]*)"/)?.[1] ?? "";
  if (!id || /^[0-]+$/.test(id)) {
    console.error('✘ wrangler.jsonc: "database_id" is a placeholder — paste the id from Cloudflare → D1 → family-memory-db.');
    process.exit(1);
  }
}
