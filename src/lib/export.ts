import "server-only";
import type { PersonBundle } from "./data";
import { buildPersonaPrompt } from "./integrations/persona";
import { assessQuality, QUALITY_LABELS } from "./quality";
import { MODULES } from "./questionnaire";
import { buildReport } from "./report";
import { parseJson, slugifyFile } from "./utils";

type Voice = PersonBundle["voiceRecords"][number];

export function audioFileName(v: Voice, index: number, ext: "wav" | "mp3") {
  return `audio/${String(index + 1).padStart(3, "0")}-${slugifyFile(v.title)}.${ext}`;
}

export function buildExportStats(bundle: PersonBundle) {
  const report = buildReport(bundle);
  const seconds = bundle.voiceRecords.reduce((s, v) => s + v.duration, 0);
  const qualities = bundle.voiceRecords.map((v) => assessQuality(v));
  const avgScore = qualities.length ? qualities.reduce((s, q) => s + q.score, 0) / qualities.length : 0;
  const level = avgScore >= 85 ? "excellent" : avgScore >= 60 ? "good" : "poor";
  return {
    seconds,
    recordings: bundle.voiceRecords.length,
    words: report.stats.words,
    quality: qualities.length ? { level, label: QUALITY_LABELS[level], score: Math.round(avgScore) } : null,
    sampleRates: [...new Set(bundle.voiceRecords.map((v) => v.sampleRate))],
  };
}

/** Full profile as a portable JSON document (schema family-memory-ai/v1). */
export function buildProfileJson(bundle: PersonBundle) {
  const byQ = new Map(bundle.answers.map((a) => [a.questionId, a]));
  const voiceIndex = new Map(bundle.voiceRecords.map((v, i) => [v.id, i]));
  const audioRef = (id: string | null | undefined) => {
    if (!id) return null;
    const i = voiceIndex.get(id);
    const v = i == null ? null : bundle.voiceRecords[i];
    return v && i != null ? { id: v.id, wav: audioFileName(v, i, "wav"), mp3: v.mp3Key ? audioFileName(v, i, "mp3") : null } : null;
  };

  const report = buildReport(bundle);

  return {
    schema: "family-memory-ai/v1",
    exportedAt: new Date().toISOString(),
    person: {
      id: bundle.id,
      firstName: bundle.firstName,
      middleName: bundle.middleName,
      lastName: bundle.lastName,
      birthDate: bundle.birthDate,
      birthPlace: bundle.birthPlace,
      residence: bundle.residence,
      education: bundle.education,
      profession: bundle.profession,
      bio: bundle.bio,
      hasPhoto: !!bundle.photoKey,
    },
    sections: MODULES.filter((m) => m.kind === "questions").map((m) => ({
      module: m.slug,
      title: m.title,
      questions: (m.questions ?? []).map((q) => {
        const a = byQ.get(q.id);
        return {
          id: q.id,
          text: q.text,
          type: q.type,
          answer: a
            ? { text: a.text, value: parseJson(a.value, null), audio: audioRef(a.voiceRecordId), updatedAt: a.updatedAt }
            : null,
        };
      }),
    })),
    tests: Object.fromEntries(
      bundle.testResults.map((t) => [t.kind, { completed: t.completed, result: parseJson(t.result, null), answers: parseJson(t.answers, {}) }]),
    ),
    memories: bundle.memories.map((m) => ({
      id: m.id,
      title: m.title,
      content: m.content,
      period: m.period,
      place: m.place,
      people: m.people,
      emotion: m.emotion,
      tags: m.tags.map((t) => t.name),
      audio: m.voiceRecords.map((v) => audioRef(v.id)),
      createdAt: m.createdAt,
    })),
    favorites: bundle.favorites.map((f) => ({ kind: f.kind, title: f.title, note: f.note })),
    voiceRecords: bundle.voiceRecords.map((v, i) => ({
      id: v.id,
      title: v.title,
      topic: v.topic,
      questionId: v.questionId,
      memoryId: v.memoryId,
      transcription: v.transcription,
      duration: v.duration,
      sampleRate: v.sampleRate,
      quality: assessQuality(v),
      files: { wav: audioFileName(v, i, "wav"), mp3: v.mp3Key ? audioFileName(v, i, "mp3") : null },
      createdAt: v.createdAt,
    })),
    report,
    stats: buildExportStats(bundle),
    ai: { personaSystemPrompt: buildPersonaPrompt(bundle, report) },
  };
}
