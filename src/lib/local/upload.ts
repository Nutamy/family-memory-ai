"use client";

// Moves an on-device archive into the signed-in account through the regular server API:
// one import request for the light data, then one request per memory, recording and photo,
// so every request stays within the Workers limits.
import { api } from "../client";
import type { MemoryDTO } from "../dto";
import { parseJson } from "../utils";
import { loadLocalBundle } from "./bundle";
import { localDb } from "./db";

export interface UploadProgress {
  step: string;
  done: number;
  total: number;
}

export interface UploadResult {
  personId: string;
  /** Recordings the server rejected (e.g. over VOICE_MAX_MB); the rest is uploaded. */
  failed: string[];
}

export async function uploadLocalPerson(localId: string, onProgress: (p: UploadProgress) => void): Promise<UploadResult> {
  const b = await loadLocalBundle(localId);
  if (!b) throw new Error("Профиль не найден на этом устройстве");
  const total = 1 + b.memories.length + b.voiceRecords.length + (b.photoKey ? 1 : 0);
  let done = 0;
  const tick = (step: string) => onProgress({ step, done: ++done, total });
  onProgress({ step: "Профиль и ответы", done, total });

  const { id } = await api<{ id: string }>("/api/persons/import", {
    method: "POST",
    json: {
      person: {
        firstName: b.firstName,
        middleName: b.middleName,
        lastName: b.lastName,
        birthDate: b.birthDate,
        birthPlace: b.birthPlace,
        residence: b.residence,
        education: b.education,
        profession: b.profession,
        bio: b.bio,
        ...(b.lastSection && { lastSection: b.lastSection }),
      },
      answers: b.answers.map((a) => ({ questionId: a.questionId, text: a.text, value: parseJson(a.value, null) })),
      tests: b.testResults.map((t) => ({ kind: t.kind, answers: parseJson(t.answers, {}) })),
      favorites: b.favorites.map((f) => ({ kind: f.kind, title: f.title, note: f.note })),
    },
  });
  tick("Воспоминания");

  // Oldest first, so the server keeps the original order and tag colors rotate the same way.
  const memoryIds = new Map<string, string>();
  const colorByTag = new Map(b.tags.map((t) => [t.name, t.color]));
  const recolored = new Set<string>();
  for (const m of [...b.memories].reverse()) {
    const created = await api<MemoryDTO>(`/api/persons/${id}/memories`, {
      method: "POST",
      json: { title: m.title, content: m.content, period: m.period, place: m.place, people: m.people, emotion: m.emotion, tags: m.tags.map((t) => t.name) },
    });
    memoryIds.set(m.id, created.id);
    for (const t of created.tags) {
      const color = colorByTag.get(t.name);
      if (color && color !== t.color && !recolored.has(t.id)) {
        recolored.add(t.id);
        await api(`/api/persons/${id}/tags/${t.id}`, { method: "PATCH", json: { color } });
      }
    }
    tick("Воспоминания");
  }

  const failed: string[] = [];
  for (const v of b.voiceRecords) {
    try {
      const wav = await localDb.getFile(v.wavKey);
      if (!wav) throw new Error("файл не найден");
      const form = new FormData();
      form.append("wav", wav, "record.wav");
      const mp3 = v.mp3Key ? await localDb.getFile(v.mp3Key) : undefined;
      if (mp3) form.append("mp3", mp3, "record.mp3");
      const fields = { title: v.title, topic: v.topic, questionId: v.questionId ?? "", memoryId: (v.memoryId && memoryIds.get(v.memoryId)) ?? "" };
      for (const [k, val] of Object.entries(fields)) form.append(k, val);
      for (const k of ["duration", "sampleRate", "peakDb", "rmsDb", "clipping"] as const) form.append(k, String(v[k]));
      const created = await api<{ id: string }>(`/api/persons/${id}/voice`, { method: "POST", body: form });
      if (v.transcription.trim()) {
        await api(`/api/persons/${id}/voice/${created.id}`, { method: "PATCH", json: { transcription: v.transcription } });
      }
    } catch (e) {
      failed.push(`${v.title}: ${e instanceof Error ? e.message : "ошибка"}`);
    }
    tick("Голосовые записи");
  }

  if (b.photoKey) {
    const photo = await localDb.getFile(b.photoKey);
    if (photo) {
      const form = new FormData();
      form.append("photo", photo, "photo");
      await api(`/api/persons/${id}/photo`, { method: "POST", body: form }).catch(() => failed.push("Фотография"));
    }
    tick("Фотография");
  }
  return { personId: id, failed };
}
