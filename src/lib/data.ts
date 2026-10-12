import "server-only";
import { db } from "./db";

export async function loadPersonBundle(personId: string) {
  return db.person.findUniqueOrThrow({
    where: { id: personId },
    include: {
      answers: true,
      voiceRecords: { orderBy: { createdAt: "asc" } },
      testResults: true,
      memories: { include: { tags: true, voiceRecords: true }, orderBy: { createdAt: "desc" } },
      tags: { orderBy: { name: "asc" } },
      favorites: { orderBy: { createdAt: "asc" } },
    },
  });
}

export type PersonBundle = Awaited<ReturnType<typeof loadPersonBundle>>;

/** Lightweight query for the sidebar / dashboard progress. */
export async function loadProgressInput(personId: string) {
  const [person, answers, voices, tests, memoriesCount, favorites] = await Promise.all([
    db.person.findUniqueOrThrow({ where: { id: personId } }),
    db.answer.findMany({ where: { personId }, select: { questionId: true, text: true, value: true, voiceRecordId: true } }),
    db.voiceRecord.findMany({ where: { personId }, select: { duration: true } }),
    db.testResult.findMany({ where: { personId, completed: true }, select: { kind: true } }),
    db.memory.count({ where: { personId } }),
    db.favoriteItem.findMany({ where: { personId }, select: { kind: true }, distinct: ["kind"] }),
  ]);
  return {
    person,
    answers,
    voiceDurations: voices.map((v) => v.duration),
    completedTests: tests.map((t) => t.kind),
    memoriesCount,
    favoriteKinds: favorites.map((f) => f.kind),
  };
}
