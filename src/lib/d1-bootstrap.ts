import type { D1Database } from "@cloudflare/workers-types";
import { D1_BOOTSTRAP_STEPS } from "@/generated/d1-bootstrap";

// Applies pending migrations and the question seed to D1 on the first query of an isolate.
// Uses wrangler's own d1_migrations table, so `wrangler d1 migrations apply` and this stay in sync.

let ready = false;

export async function ensureD1(db: D1Database) {
  if (ready) return;
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)",
    )
    .run();
  const { results } = await db.prepare("SELECT name FROM d1_migrations").all<{ name: string }>();
  const applied = new Set(results.map((r) => r.name));

  for (const step of D1_BOOTSTRAP_STEPS) {
    if (applied.has(step.name)) continue;
    try {
      // One batch = one transaction: a step is applied completely or not at all.
      await db.batch([
        ...step.statements.map((s) => db.prepare(s)),
        db.prepare("INSERT INTO d1_migrations (name) VALUES (?)").bind(step.name),
      ]);
    } catch (e) {
      // A concurrent first request may have applied the same step a moment earlier.
      const done = await db.prepare("SELECT 1 FROM d1_migrations WHERE name = ?").bind(step.name).first();
      if (!done) throw e;
    }
  }
  ready = true;
}
