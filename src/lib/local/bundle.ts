// Assembles on-device rows into the same shapes the server loads from Prisma (src/lib/data.ts).
import type { PersonBundle } from "../data";
import type { ProgressInput } from "../progress";
import { localDb } from "./db";

const byCreatedAsc = <T extends { createdAt: Date }>(a: T, b: T) => a.createdAt.getTime() - b.createdAt.getTime();

export async function listLocalPersons() {
  return (await localDb.all("persons")).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function loadLocalBundle(personId: string): Promise<PersonBundle | null> {
  const person = await localDb.get("persons", personId);
  if (!person) return null;
  const [answers, voiceRecords, testResults, memories, tags, favorites] = await Promise.all([
    localDb.byPerson("answers", personId),
    localDb.byPerson("voiceRecords", personId),
    localDb.byPerson("testResults", personId),
    localDb.byPerson("memories", personId),
    localDb.byPerson("tags", personId),
    localDb.byPerson("favorites", personId),
  ]);
  voiceRecords.sort(byCreatedAsc);
  const tagById = new Map(tags.map((t) => [t.id, t]));
  return {
    ...person,
    answers,
    voiceRecords,
    testResults,
    memories: memories
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(({ tagIds, ...m }) => ({
        ...m,
        tags: tagIds.map((id) => tagById.get(id)).filter((t): t is NonNullable<typeof t> => !!t),
        voiceRecords: voiceRecords.filter((v) => v.memoryId === m.id),
      })),
    tags: tags.sort((a, b) => a.name.localeCompare(b.name)),
    favorites: favorites.sort(byCreatedAsc),
  };
}

export function progressInputOf(bundle: PersonBundle): ProgressInput {
  return {
    person: bundle,
    answers: bundle.answers,
    voiceDurations: bundle.voiceRecords.map((v) => v.duration),
    completedTests: bundle.testResults.filter((t) => t.completed).map((t) => t.kind),
    memoriesCount: bundle.memories.length,
    favoriteKinds: [...new Set(bundle.favorites.map((f) => f.kind))],
  };
}
