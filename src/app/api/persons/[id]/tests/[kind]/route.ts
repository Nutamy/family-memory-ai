import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { testAnswersSchema } from "@/lib/schemas";
import { cleanTestAnswers, isTestKind, scoreTest, TEST_META } from "@/lib/tests";

export const PUT = route<{ id: string; kind: string }>(async (req, { id, kind }) => {
  await assertPersonAccess(id);
  if (!isTestKind(kind)) throw new HttpError(404, "Неизвестный тест");
  const parsed = testAnswersSchema.safeParse((await req.json().catch(() => ({})))?.answers ?? {});
  if (!parsed.success) throw new HttpError(400, "Некорректные данные");
  const answers = cleanTestAnswers(kind, parsed.data);
  const completed = Object.keys(answers).length >= TEST_META[kind].total;
  const result = completed ? scoreTest(kind, answers) : null;
  const data = { answers: JSON.stringify(answers), result: JSON.stringify(result), completed };
  await db.testResult.upsert({
    where: { personId_kind: { personId: id, kind } },
    create: { personId: id, kind, ...data },
    update: data,
  });
  return NextResponse.json({ completed, result });
});

export const DELETE = route<{ id: string; kind: string }>(async (_req, { id, kind }) => {
  await assertPersonAccess(id);
  await db.testResult.deleteMany({ where: { personId: id, kind } });
  return NextResponse.json({ ok: true });
});
