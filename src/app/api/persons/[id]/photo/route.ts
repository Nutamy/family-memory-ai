import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export const GET = route<{ id: string }>(async (_req, { id }) => {
  const person = await assertPersonAccess(id);
  if (!person.photoKey) throw new HttpError(404, "Фото не загружено");
  const data = await storage().get(person.photoKey);
  const ext = person.photoKey.split(".").pop() ?? "jpg";
  return new Response(new Uint8Array(data), { headers: { "Content-Type": MIME[ext] ?? "image/jpeg", "Cache-Control": "private, max-age=60" } });
});

export const POST = route<{ id: string }>(async (req, { id }) => {
  const person = await assertPersonAccess(id);
  const file = (await req.formData()).get("photo");
  if (!(file instanceof File)) throw new HttpError(400, "Файл не найден");
  const ext = TYPES[file.type];
  if (!ext) throw new HttpError(400, "Поддерживаются JPG, PNG и WebP");
  if (file.size > 10 * 1024 * 1024) throw new HttpError(400, "Фото больше 10 МБ");
  const key = `persons/${id}/photo-${Date.now()}.${ext}`;
  await storage().put(key, Buffer.from(await file.arrayBuffer()), file.type);
  if (person.photoKey) await storage().delete(person.photoKey).catch(() => {});
  await db.person.update({ where: { id }, data: { photoKey: key } });
  return NextResponse.json({ ok: true });
});

export const DELETE = route<{ id: string }>(async (_req, { id }) => {
  const person = await assertPersonAccess(id);
  if (person.photoKey) await storage().delete(person.photoKey).catch(() => {});
  await db.person.update({ where: { id }, data: { photoKey: null } });
  return NextResponse.json({ ok: true });
});
