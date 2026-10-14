import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, requireApiUserId } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { getQuestion } from "@/lib/questionnaire";
import { answerSchema, favoriteSchema, personCreateSchema, personPatchSchema, testAnswersSchema } from "@/lib/schemas";
import { assertPersonQuota, QUOTA } from "@/lib/security/quota";
import { rateLimit } from "@/lib/security/rate-limit";
import { cleanTestAnswers, isTestKind, scoreTest, TEST_META } from "@/lib/tests";

const schema = z.object({
  person: personCreateSchema.extend(personPatchSchema.omit({ firstName: true }).shape),
  answers: z.array(answerSchema).max(1000),
  tests: z.array(z.object({ kind: z.string().max(20), answers: testAnswersSchema })).max(10),
  favorites: z.array(favoriteSchema).max(QUOTA.favorites),
});

/**
 * First step of moving an on-device archive into the account: profile, answers, tests and favorites
 * in a handful of batched queries (D1 allows 50 queries per request on Workers Free).
 * Memories, recordings and the photo follow through the regular routes, one request each.
 */
export const POST = route(async (req) => {
  const userId = await requireApiUserId();
  await rateLimit(`import:${userId}`, { limit: 20, windowSec: 60 * 60 });
  await assertPersonQuota(userId);
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
  const { person: data, answers, tests, favorites } = parsed.data;

  const person = await db.person.create({ data: { ...data, userId } });
  const personId = person.id;

  const validAnswers = answers.filter((a) => getQuestion(a.questionId));
  if (validAnswers.length) {
    await db.answer.createMany({
      data: validAnswers.map((a) => ({ personId, questionId: a.questionId, text: a.text ?? "", value: JSON.stringify(a.value ?? null) })),
    });
  }

  const testRows = tests.flatMap((t) => {
    if (!isTestKind(t.kind)) return [];
    const clean = cleanTestAnswers(t.kind, t.answers);
    const completed = Object.keys(clean).length >= TEST_META[t.kind].total;
    const result = completed ? scoreTest(t.kind, clean) : null;
    return [{ personId, kind: t.kind, answers: JSON.stringify(clean), result: JSON.stringify(result), completed }];
  });
  if (testRows.length) await db.testResult.createMany({ data: testRows });

  if (favorites.length) await db.favoriteItem.createMany({ data: favorites.map((f) => ({ ...f, personId })) });

  return NextResponse.json({ id: personId }, { status: 201 });
});
