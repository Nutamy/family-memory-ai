import "server-only";
import { db } from "./db";
import { TAG_COLORS } from "./questionnaire";

/** Resolves tag names to Tag rows of the person, creating missing ones with a rotating color. */
export async function resolveTags(personId: string, names: string[]) {
  const unique = [...new Set(names.map((n) => n.replace(/^#/, "").trim()).filter(Boolean))];
  const existing = await db.tag.findMany({ where: { personId, name: { in: unique } } });
  let count = await db.tag.count({ where: { personId } });
  const created = [];
  for (const name of unique.filter((n) => !existing.some((t) => t.name === n))) {
    created.push(await db.tag.create({ data: { personId, name, color: TAG_COLORS[count++ % TAG_COLORS.length] } }));
  }
  return [...existing, ...created].map((t) => ({ id: t.id }));
}

export { memorySchema, toMemoryDTO } from "./dto";

export const memoryInclude = { tags: true, voiceRecords: { orderBy: { createdAt: "asc" as const } } };

/** Drops tags no memory uses anymore, so the tag cloud stays clean. */
export async function pruneTags(personId: string) {
  await db.tag.deleteMany({ where: { personId, memories: { none: {} } } });
}
