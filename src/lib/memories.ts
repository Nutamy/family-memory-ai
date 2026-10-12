import "server-only";
import { z } from "zod";
import { db } from "./db";
import { toVoiceDTO, type MemoryDTO } from "./dto";
import { TAG_COLORS } from "./questionnaire";

export const memorySchema = z.object({
  title: z.string().trim().min(1, "Добавьте заголовок").max(300),
  content: z.string().max(100_000).default(""),
  period: z.string().trim().max(200).default(""),
  place: z.string().trim().max(200).default(""),
  people: z.string().trim().max(500).default(""),
  emotion: z.string().trim().max(50).default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
});

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

export const memoryInclude = { tags: true, voiceRecords: { orderBy: { createdAt: "asc" as const } } };

export function toMemoryDTO(m: {
  id: string;
  title: string;
  content: string;
  period: string;
  place: string;
  people: string;
  emotion: string;
  createdAt: Date;
  tags: { id: string; name: string; color: string }[];
  voiceRecords: Parameters<typeof toVoiceDTO>[0][];
}): MemoryDTO {
  return {
    id: m.id,
    title: m.title,
    content: m.content,
    period: m.period,
    place: m.place,
    people: m.people,
    emotion: m.emotion,
    tags: m.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    voiceRecords: m.voiceRecords.map(toVoiceDTO),
    createdAt: m.createdAt.toISOString(),
  };
}

/** Drops tags no memory uses anymore, so the tag cloud stays clean. */
export async function pruneTags(personId: string) {
  await db.tag.deleteMany({ where: { personId, memories: { none: {} } } });
}
