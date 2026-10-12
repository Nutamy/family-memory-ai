// Generates SQL that upserts the question catalogue into D1 (Answer rows reference it).
// The demo account is deliberately not included: production must not have known credentials.
// Usage: npm run d1:seed (local) / npm run d1:seed:remote
import { writeFileSync } from "fs";
import { ALL_QUESTIONS } from "../src/lib/questionnaire";

const q = (v: string | number) => (typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);

const rows = ALL_QUESTIONS.map((x) =>
  [x.id, x.category, x.text, x.hint ?? "", x.type, JSON.stringify(x.options ?? x.slider ?? null), x.minWords ?? 0, x.order].map(q).join(", "),
);

const sql = rows
  .map(
    (r) =>
      `INSERT INTO "Question" ("id", "category", "text", "hint", "type", "options", "minWords", "order") VALUES (${r})\n` +
      `ON CONFLICT ("id") DO UPDATE SET "category" = excluded."category", "text" = excluded."text", "hint" = excluded."hint", ` +
      `"type" = excluded."type", "options" = excluded."options", "minWords" = excluded."minWords", "order" = excluded."order";`,
  )
  .join("\n");

const out = process.argv[2] ?? ".wrangler/d1-seed.sql";
writeFileSync(out, sql + "\n");
console.log(`✓ ${ALL_QUESTIONS.length} questions → ${out}`);
