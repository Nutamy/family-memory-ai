// The JSON API of on-device archives, run by the service worker (src/lib/local/sw.ts).
// It answers the same /api/persons/<id>/… requests as the server routes for ids starting with
// "loc_", so components, <audio src> and download links work unchanged in both modes.
import type { Answer, Person, VoiceRecord } from "@prisma/client";
import { archiveBaseName, buildArchiveZip } from "../archive";
import { memorySchema, toMemoryDTO, toVoiceDTO } from "../dto";
import { buildProfileJson } from "../export";
import { getQuestion, LOCAL_ID_PREFIX, TAG_COLORS } from "../questionnaire";
import { answerSchema, favoriteSchema, personCreateSchema, personPatchSchema, tagPatchSchema, voicePatchSchema } from "../schemas";
import { sniffFile } from "../security/file-signature";
import { isTestKind, scoreTest, TEST_META } from "../tests";
import { slugifyFile } from "../utils";
import { loadLocalBundle } from "./bundle";
import { deleteLocalPerson, localDb, type LocalMemory } from "./db";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

const newId = () => crypto.randomUUID().replace(/-/g, "");

async function body(req: Request) {
  return req.json().catch(() => ({}));
}

function parse<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } }, value: unknown) {
  const r = schema.safeParse(value);
  if (!r.success) throw new ApiError(400, r.error.issues[0]?.message ?? "Некорректные данные");
  return r.data;
}

async function person(id: string) {
  const p = await localDb.get("persons", id);
  if (!p) throw new ApiError(404, "Профиль не найден");
  return p;
}

const touch = async (p: Person) => localDb.put("persons", { ...p, updatedAt: new Date() });

function attachment(name: string, fallback: string) {
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

async function memoryDTO(m: LocalMemory) {
  const [tags, voices] = await Promise.all([localDb.byPerson("tags", m.personId), localDb.byPerson("voiceRecords", m.personId)]);
  return toMemoryDTO({
    ...m,
    tags: m.tagIds.map((id) => tags.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => !!t),
    voiceRecords: voices.filter((v) => v.memoryId === m.id).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  });
}

/** Same as resolveTags on the server: names → tag ids, creating missing tags with a rotating color. */
async function resolveTags(personId: string, names: string[]) {
  const tags = await localDb.byPerson("tags", personId);
  const ids: string[] = [];
  for (const name of new Set(names.map((n) => n.replace(/^#/, "").trim()).filter(Boolean))) {
    let tag = tags.find((t) => t.name === name);
    if (!tag) {
      tag = { id: newId(), personId, name, color: TAG_COLORS[tags.length % TAG_COLORS.length] };
      tags.push(tag);
      await localDb.put("tags", tag);
    }
    ids.push(tag.id);
  }
  return ids;
}

async function pruneTags(personId: string) {
  const used = new Set((await localDb.byPerson("memories", personId)).flatMap((m) => m.tagIds));
  for (const t of await localDb.byPerson("tags", personId)) if (!used.has(t.id)) await localDb.delete("tags", t.id);
}

async function setAnswerVoice(personId: string, questionId: string, voiceRecordId: string | null, onlyIfEmpty = false) {
  const id = `${personId}:${questionId}`;
  const existing = await localDb.get("answers", id);
  if (onlyIfEmpty && existing?.voiceRecordId) return;
  const now = new Date();
  const row: Answer = existing ?? { id, personId, questionId, text: "", value: "null", voiceRecordId: null, createdAt: now, updatedAt: now };
  await localDb.put("answers", { ...row, voiceRecordId, updatedAt: now });
}

async function serveAudio(req: Request, r: VoiceRecord) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "mp3" && r.mp3Key ? "mp3" : "wav";
  const blob = await localDb.getFile(format === "mp3" ? r.mp3Key! : r.wavKey);
  if (!blob) throw new ApiError(404, "Файл записи не найден");
  const headers: Record<string, string> = { "Content-Type": format === "mp3" ? "audio/mpeg" : "audio/wav", "Accept-Ranges": "bytes" };
  if (url.searchParams.get("download")) headers["Content-Disposition"] = attachment(`${slugifyFile(r.title)}.${format}`, `record.${format}`);

  // <audio> seeks with Range requests; Blob.slice keeps that cheap.
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const size = blob.size;
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(blob.slice(start, end + 1), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(blob, { headers: { ...headers, "Content-Length": String(blob.size) } });
}

async function route(req: Request, parts: string[]): Promise<Response> {
  const method = req.method;

  // /api/local/persons — create (the list is read straight from IndexedDB by the page).
  if (parts[0] === "local" && parts[1] === "persons" && parts.length === 2 && method === "POST") {
    const data = parse(personCreateSchema, await body(req));
    const now = new Date();
    const p: Person = {
      id: `${LOCAL_ID_PREFIX}${newId()}`,
      userId: "local",
      ...data,
      birthDate: "",
      birthPlace: "",
      residence: "",
      education: "",
      profession: "",
      bio: "",
      photoKey: null,
      lastSection: "basic",
      createdAt: now,
      updatedAt: now,
    };
    await localDb.put("persons", p);
    return json(p, 201);
  }

  if (parts[0] !== "persons" || !parts[1]) throw new ApiError(404, "Не найдено");
  const id = parts[1];
  const p = await person(id);
  const [, , section, sub, action] = parts;

  if (!section) {
    if (method === "GET") return json(p);
    if (method === "PATCH") {
      const updated = { ...p, ...parse(personPatchSchema, await body(req)), updatedAt: new Date() };
      await localDb.put("persons", updated);
      return json(updated);
    }
    if (method === "DELETE") {
      await deleteLocalPerson(id);
      return json({ ok: true });
    }
  }

  if (section === "answers" && method === "PUT") {
    const { questionId, text, value } = parse(answerSchema, await body(req));
    if (!getQuestion(questionId)) throw new ApiError(400, "Неизвестный вопрос");
    const key = `${id}:${questionId}`;
    const now = new Date();
    const prev = await localDb.get("answers", key);
    const row: Answer = {
      ...(prev ?? { id: key, personId: id, questionId, text: "", value: "null", voiceRecordId: null, createdAt: now }),
      ...(text !== undefined && { text }),
      ...(value !== undefined && { value: JSON.stringify(value) }),
      updatedAt: now,
    };
    await localDb.put("answers", row);
    await touch(p);
    return json({ ok: true, updatedAt: now });
  }

  if (section === "tests" && sub && isTestKind(sub)) {
    const key = `${id}:${sub}`;
    if (method === "PUT") {
      const b = await body(req);
      const answers = (b.answers && typeof b.answers === "object" ? b.answers : {}) as Record<string, unknown>;
      const completed = Object.keys(answers).length >= TEST_META[sub].total;
      const result = completed ? scoreTest(sub, answers) : null;
      await localDb.put("testResults", {
        id: key,
        personId: id,
        kind: sub,
        answers: JSON.stringify(answers),
        result: JSON.stringify(result),
        completed,
        updatedAt: new Date(),
      });
      return json({ completed, result });
    }
    if (method === "DELETE") {
      await localDb.delete("testResults", key);
      return json({ ok: true });
    }
  }

  if (section === "memories") {
    if (!sub && method === "GET") {
      const all = (await localDb.byPerson("memories", id)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return json(await Promise.all(all.map(memoryDTO)));
    }
    if (!sub && method === "POST") {
      const { tags, ...data } = parse(memorySchema, await body(req));
      const now = new Date();
      const m: LocalMemory = { id: newId(), personId: id, ...data, tagIds: await resolveTags(id, tags), createdAt: now, updatedAt: now };
      await localDb.put("memories", m);
      return json(await memoryDTO(m), 201);
    }
    const m = sub ? await localDb.get("memories", sub) : undefined;
    if (!m || m.personId !== id) throw new ApiError(404, "Воспоминание не найдено");
    if (method === "PATCH") {
      const { tags, ...data } = parse(memorySchema.partial(), await body(req));
      const updated: LocalMemory = { ...m, ...data, ...(tags && { tagIds: await resolveTags(id, tags) }), updatedAt: new Date() };
      await localDb.put("memories", updated);
      await pruneTags(id);
      return json(await memoryDTO(updated));
    }
    if (method === "DELETE") {
      await localDb.delete("memories", m.id);
      // Server: VoiceRecord.memoryId is SET NULL on delete.
      for (const v of await localDb.byPerson("voiceRecords", id)) if (v.memoryId === m.id) await localDb.put("voiceRecords", { ...v, memoryId: null });
      await pruneTags(id);
      return json({ ok: true });
    }
  }

  if (section === "tags" && sub) {
    const tag = await localDb.get("tags", sub);
    if (!tag || tag.personId !== id) throw new ApiError(404, "Тег не найден");
    if (method === "PATCH") {
      await localDb.put("tags", { ...tag, ...parse(tagPatchSchema, await body(req)) });
      return json({ ok: true });
    }
    if (method === "DELETE") {
      await localDb.delete("tags", tag.id);
      for (const m of await localDb.byPerson("memories", id)) {
        if (m.tagIds.includes(tag.id)) await localDb.put("memories", { ...m, tagIds: m.tagIds.filter((t) => t !== tag.id) });
      }
      return json({ ok: true });
    }
  }

  if (section === "favorites") {
    if (!sub && method === "POST") {
      const item = { id: newId(), personId: id, ...parse(favoriteSchema, await body(req)), createdAt: new Date() };
      await localDb.put("favorites", item);
      return json({ id: item.id, kind: item.kind, title: item.title, note: item.note }, 201);
    }
    if (sub && method === "DELETE") {
      const item = await localDb.get("favorites", sub);
      if (item?.personId === id) await localDb.delete("favorites", sub);
      return json({ ok: true });
    }
  }

  if (section === "photo") {
    if (method === "GET") {
      const blob = p.photoKey ? await localDb.getFile(p.photoKey) : undefined;
      if (!blob) throw new ApiError(404, "Фото не загружено");
      return new Response(blob, { headers: { "Content-Type": blob.type || "image/jpeg" } });
    }
    if (method === "POST") {
      const file = (await req.formData()).get("photo");
      if (!(file instanceof Blob)) throw new ApiError(400, "Файл не найден");
      if (file.size > 10 * 1024 * 1024) throw new ApiError(400, "Фото больше 10 МБ");
      const kind = await sniffFile(file);
      if (kind !== "jpg" && kind !== "png" && kind !== "webp") throw new ApiError(400, "Поддерживаются JPG, PNG и WebP");
      const key = `persons/${id}/photo-${Date.now()}.${kind}`;
      await localDb.putFile(key, new Blob([file], { type: kind === "jpg" ? "image/jpeg" : `image/${kind}` }));
      if (p.photoKey) await localDb.deleteFile(p.photoKey);
      await localDb.put("persons", { ...p, photoKey: key });
      return json({ ok: true });
    }
    if (method === "DELETE") {
      if (p.photoKey) await localDb.deleteFile(p.photoKey);
      await localDb.put("persons", { ...p, photoKey: null });
      return json({ ok: true });
    }
  }

  if (section === "voice") {
    if (!sub && method === "GET") {
      const all = (await localDb.byPerson("voiceRecords", id)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return json(all.map(toVoiceDTO));
    }
    if (!sub && method === "POST") {
      const form = await req.formData();
      const wav = form.get("wav");
      const mp3 = form.get("mp3");
      if (!(wav instanceof Blob) || wav.size < 44 || (await sniffFile(wav)) !== "wav") throw new ApiError(400, "Нет аудиофайла");
      const num = (k: string) => (Number.isFinite(Number(form.get(k))) ? Number(form.get(k)) : 0);
      const str = (k: string) => String(form.get(k) ?? "").trim();
      const questionId = str("questionId") || null;
      if (questionId && !getQuestion(questionId)) throw new ApiError(400, "Неизвестный вопрос");
      const memoryId = str("memoryId") || null;
      if (memoryId && (await localDb.get("memories", memoryId))?.personId !== id) throw new ApiError(400, "Воспоминание не найдено");

      const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const wavKey = `persons/${id}/audio/${stamp}.wav`;
      await localDb.putFile(wavKey, new Blob([wav], { type: "audio/wav" }));
      let mp3Key: string | null = null;
      if (mp3 instanceof Blob && mp3.size > 0) {
        mp3Key = `persons/${id}/audio/${stamp}.mp3`;
        await localDb.putFile(mp3Key, new Blob([mp3], { type: "audio/mpeg" }));
      }
      const record: VoiceRecord = {
        id: newId(),
        personId: id,
        questionId,
        memoryId,
        title: str("title").slice(0, 300) || "Голосовая запись",
        topic: str("topic").slice(0, 100),
        transcription: "",
        wavKey,
        mp3Key,
        duration: num("duration"),
        sampleRate: Math.round(num("sampleRate")),
        sizeBytes: wav.size,
        peakDb: num("peakDb"),
        rmsDb: num("rmsDb"),
        clipping: num("clipping"),
        createdAt: new Date(),
      };
      await localDb.put("voiceRecords", record);
      if (questionId) await setAnswerVoice(id, questionId, record.id);
      await touch(p);
      return json(toVoiceDTO(record), 201);
    }

    const r = sub ? await localDb.get("voiceRecords", sub) : undefined;
    if (!r || r.personId !== id) throw new ApiError(404, "Запись не найдена");
    if (action === "transcribe") throw new ApiError(501, "Автоматическая расшифровка работает только в аккаунте. Текст можно вписать вручную.");
    if (method === "GET") return serveAudio(req, r);
    if (method === "PATCH") {
      const updated = { ...r, ...parse(voicePatchSchema, await body(req)) };
      await localDb.put("voiceRecords", updated);
      return json(toVoiceDTO(updated));
    }
    if (method === "DELETE") {
      await localDb.delete("voiceRecords", r.id);
      await Promise.all([r.wavKey, r.mp3Key].filter((k): k is string => !!k).map((k) => localDb.deleteFile(k)));
      if (r.questionId) {
        // Mirrors the server: the answer falls back to the previous recording of that question.
        const answer = await localDb.get("answers", `${id}:${r.questionId}`);
        if (answer?.voiceRecordId === r.id) {
          const prev = (await localDb.byPerson("voiceRecords", id))
            .filter((v) => v.questionId === r.questionId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
          await setAnswerVoice(id, r.questionId, prev?.id ?? null);
        }
      }
      return json({ ok: true });
    }
  }

  if (section === "export" && method === "GET") {
    const bundle = (await loadLocalBundle(id))!;
    if (sub === "json") {
      return new Response(JSON.stringify(buildProfileJson(bundle), null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": attachment(`${archiveBaseName(bundle)}-profile.json`, "profile.json"),
        },
      });
    }
    if (sub === "zip") {
      const full = new URL(req.url).searchParams.get("type") === "full";
      const data = await buildArchiveZip(bundle, { full }, async (key) => {
        const blob = await localDb.getFile(key);
        if (!blob) throw new Error(`missing ${key}`);
        return blob;
      });
      const kind = full ? "archive" : "audio";
      return new Response(data as BodyInit, {
        headers: { "Content-Type": "application/zip", "Content-Disposition": attachment(`${archiveBaseName(bundle)}-${kind}.zip`, `${kind}.zip`) },
      });
    }
  }

  throw new ApiError(404, "Не найдено");
}

/** Paths the local API owns: everything of "loc_" persons plus /api/local/*. */
export function isLocalApiPath(pathname: string) {
  return pathname.startsWith(`/api/persons/${LOCAL_ID_PREFIX}`) || pathname.startsWith("/api/local/");
}

export async function handleLocalApi(req: Request): Promise<Response> {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean).slice(1).map(decodeURIComponent);
  try {
    return await route(req, parts);
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: e instanceof Error && e.name === "QuotaExceededError" ? "Недостаточно места в браузере" : "Ошибка локального хранилища" }, 500);
  }
}
