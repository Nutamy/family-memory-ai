// Request schemas shared by the server API routes and the in-browser API of local archives.
import { z } from "zod";
import { FAVORITE_KINDS, MODULES, TAG_COLORS } from "./questionnaire";

const s = z.string().trim().max(5000);

export const personCreateSchema = z.object({
  firstName: z.string().trim().min(1, "Укажите имя").max(100),
  lastName: z.string().trim().max(100).default(""),
  middleName: z.string().trim().max(100).default(""),
});

export const personPatchSchema = z
  .object({
    firstName: z.string().trim().min(1, "Имя не может быть пустым").max(100),
    lastName: s,
    middleName: s,
    birthDate: s,
    birthPlace: s,
    residence: s,
    education: s,
    profession: s,
    bio: z.string().max(20000),
    lastSection: z.enum(MODULES.map((m) => m.slug) as [string, ...string[]]),
  })
  .partial();

export const answerSchema = z.object({
  questionId: z.string(),
  text: z.string().max(100_000).optional(),
  value: z.union([z.string(), z.number(), z.array(z.string()), z.null()]).optional(),
});

export const favoriteSchema = z.object({
  kind: z.enum(FAVORITE_KINDS.map((k) => k.kind) as [string, ...string[]]),
  title: z.string().trim().min(1, "Заполните название").max(1000),
  note: z.string().trim().max(20_000).default(""),
});

export const tagPatchSchema = z.object({ name: z.string().trim().min(1).max(40), color: z.enum(TAG_COLORS) }).partial();

export const voicePatchSchema = z
  .object({ title: z.string().trim().min(1).max(300), topic: z.string().trim().max(100), transcription: z.string().max(200_000) })
  .partial();
