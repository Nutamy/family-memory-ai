import { CHAPTERS, FAVORITE_KINDS, MODULES } from "./questionnaire";
import { TEST_KINDS } from "./tests";
import { parseJson } from "./utils";

export interface ProgressInput {
  person: {
    firstName: string;
    lastName: string;
    birthDate: string;
    birthPlace: string;
    residence: string;
    education: string;
    profession: string;
    bio: string;
  };
  answers: { questionId: string; text: string; value: string; voiceRecordId: string | null }[];
  voiceDurations: number[];
  completedTests: string[];
  memoriesCount: number;
  favoriteKinds: string[];
}

export interface Progress {
  done: number;
  total: number;
  percent: number;
}

export interface ProgressSummary {
  overall: Progress;
  modules: Record<string, Progress>;
  chapters: Record<string, Progress>;
  recordedSeconds: number;
  recordings: number;
  answered: number;
  totalQuestions: number;
}

// Targets for open-ended sections, so they contribute a finite share of the total.
export const MEMORY_TARGET = 5;
export const VOICE_TARGET_MINUTES = 10;

const PROFILE_FIELDS = ["firstName", "birthDate", "birthPlace", "residence", "education", "profession", "bio"] as const;

export function isAnswered(a: { text: string; value: string; voiceRecordId: string | null } | undefined): boolean {
  if (!a) return false;
  if (a.voiceRecordId) return true;
  if (a.text.trim()) return true;
  const v = parseJson<unknown>(a.value, null);
  if (v == null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

const p = (done: number, total: number): Progress => ({
  done,
  total,
  percent: total ? Math.min(100, Math.round((done / total) * 100)) : 0,
});

export function computeProgress(input: ProgressInput): ProgressSummary {
  const byQ = new Map(input.answers.map((a) => [a.questionId, a]));
  const modules: Record<string, Progress> = {};
  const recordedSeconds = input.voiceDurations.reduce((s, d) => s + d, 0);
  let answered = 0;
  let totalQuestions = 0;

  for (const m of MODULES) {
    let done = 0;
    let total = 0;
    if (m.kind === "questions") {
      for (const q of m.questions ?? []) {
        total++;
        totalQuestions++;
        if (isAnswered(byQ.get(q.id))) {
          done++;
          answered++;
        }
      }
      if (m.withProfile) {
        for (const f of PROFILE_FIELDS) {
          total++;
          if (String(input.person[f] ?? "").trim()) done++;
        }
      }
    } else if (m.kind === "tests") {
      total = TEST_KINDS.length;
      done = TEST_KINDS.filter((k) => input.completedTests.includes(k)).length;
    } else if (m.kind === "memories") {
      total = MEMORY_TARGET;
      done = Math.min(input.memoriesCount, MEMORY_TARGET);
    } else if (m.kind === "voice") {
      total = VOICE_TARGET_MINUTES;
      done = Math.min(recordedSeconds / 60, VOICE_TARGET_MINUTES);
    } else if (m.kind === "favorites") {
      total = FAVORITE_KINDS.length;
      done = FAVORITE_KINDS.filter((k) => input.favoriteKinds.includes(k.kind)).length;
    }
    modules[m.slug] = p(done, total);
  }

  const chapters: Record<string, Progress> = {};
  let allDone = 0;
  let allTotal = 0;
  for (const c of CHAPTERS) {
    // Each module weighs equally inside a chapter, each chapter equally overall,
    // so long modules don't dominate the percentage.
    const pcts = c.modules.map((s) => modules[s]?.percent ?? 0);
    const avg = pcts.reduce((a, b) => a + b, 0) / (pcts.length || 1);
    chapters[c.slug] = { done: avg, total: 100, percent: Math.round(avg) };
    allDone += avg;
    allTotal += 100;
  }

  return {
    overall: p(allDone, allTotal),
    modules,
    chapters,
    recordedSeconds,
    recordings: input.voiceDurations.length,
    answered,
    totalQuestions,
  };
}
