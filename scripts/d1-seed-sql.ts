// Writes the question catalogue as SQL for `wrangler d1 execute`.
// Usage: npm run d1:seed (local) / npm run d1:seed:remote
// Deployed Workers also seed themselves on first request (src/lib/d1-bootstrap.ts).
import { writeFileSync } from "fs";
import { questionSeedStatements } from "./question-seed";

const statements = questionSeedStatements();
const out = process.argv[2] ?? ".wrangler/d1-seed.sql";
writeFileSync(out, statements.join("\n") + "\n");
console.log(`✓ ${statements.length} questions → ${out}`);
