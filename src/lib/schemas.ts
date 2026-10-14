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
  questionId: z.string().max(100),
  text: z.string().max(100_000).optional(),
  value: z.union([z.string().max(1000), z.number().finite(), z.array(z.string().max(1000)).max(50), z.null()]).optional(),
});

/** Raw test answers; route handlers narrow them further with cleanTestAnswers(). */
export const testAnswersSchema = z.record(z.string().max(20), z.union([z.number(), z.string().max(20)])).refine((r) => Object.keys(r).length <= 100);

export const favoriteSchema = z.object({
  kind: z.enum(FAVORITE_KINDS.map((k) => k.kind) as [string, ...string[]]),
  title: z.string().trim().min(1, "Заполните название").max(1000),
  note: z.string().trim().max(20_000).default(""),
});

export const tagPatchSchema = z.object({ name: z.string().trim().min(1).max(40), color: z.enum(TAG_COLORS) }).partial();

export const voicePatchSchema = z
  .object({ title: z.string().trim().min(1).max(300), topic: z.string().trim().max(100), transcription: z.string().max(200_000) })
  .partial();
