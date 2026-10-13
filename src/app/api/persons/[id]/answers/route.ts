import { NextResponse } from "next/server";
import { assertPersonAccess, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { getQuestion } from "@/lib/questionnaire";
import { answerSchema } from "@/lib/schemas";

/** Upsert of a single answer — called by autosave. */
export const PUT = route<{ id: string }>(async (req, { id }) => {
  await assertPersonAccess(id);
  const parsed = answerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, "Некорректные данные");
  const { questionId, text, value } = parsed.data;
  if (!getQuestion(questionId)) throw new HttpError(400, "Неизвестный вопрос");

  const data = {
    ...(text !== undefined && { text }),
    ...(value !== undefined && { value: JSON.stringify(value) }),
  };
  const answer = await db.answer.upsert({
    where: { personId_questionId: { personId: id, questionId } },
    create: { personId: id, questionId, ...data },
    update: data,
  });
  await db.person.update({ where: { id }, data: { updatedAt: new Date() } });
  return NextResponse.json({ ok: true, updatedAt: answer.updatedAt });
});
