// Upsert statements for the question catalogue (Answer rows reference it).
// The demo account is deliberately not included: production must not have known credentials.
import { ALL_QUESTIONS } from "../src/lib/questionnaire";

const lit = (v: string | number) => (typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);

export function questionSeedStatements() {
  return ALL_QUESTIONS.map((x) => {
    const values = [x.id, x.category, x.text, x.hint ?? "", x.type, JSON.stringify(x.options ?? x.slider ?? null), x.minWords ?? 0, x.order]
      .map(lit)
      .join(", ");
    return (
      `INSERT INTO "Question" ("id", "category", "text", "hint", "type", "options", "minWords", "order") VALUES (${values}) ` +
      `ON CONFLICT ("id") DO UPDATE SET "category" = excluded."category", "text" = excluded."text", "hint" = excluded."hint", ` +
      `"type" = excluded."type", "options" = excluded."options", "minWords" = excluded."minWords", "order" = excluded."order";`
    );
  });
}
