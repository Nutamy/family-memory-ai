import { notFound, redirect } from "next/navigation";
import { ModuleView, toAnswerDTO } from "@/components/views/section-views";
import { requirePerson } from "@/lib/auth";
import { db } from "@/lib/db";
import { toVoiceDTO } from "@/lib/dto";
import { loadProgressInput } from "@/lib/data";
import { computeProgress } from "@/lib/progress";
import { getModule, moduleHref } from "@/lib/questionnaire";

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }) {
  return { title: getModule((await params).module)?.title ?? "Раздел" };
}

export default async function ModulePage({ params }: { params: Promise<{ personId: string; module: string }> }) {
  const { personId, module: slug } = await params;
  const m = getModule(slug);
  if (!m) notFound();
  if (m.kind !== "questions") redirect(moduleHref(personId, slug));
  const { person } = await requirePerson(personId);

  const ids = (m.questions ?? []).map((q) => q.id);
  const [answers, records, progressInput] = await Promise.all([
    db.answer.findMany({ where: { personId, questionId: { in: ids } } }),
    db.voiceRecord.findMany({ where: { personId, questionId: { in: ids } }, orderBy: { createdAt: "desc" } }),
    loadProgressInput(personId),
  ]);
  return (
    <ModuleView
      personId={personId}
      module={m}
      person={person}
      answers={answers.map(toAnswerDTO)}
      records={records.map(toVoiceDTO)}
      progress={computeProgress(progressInput).modules[slug]}
    />
  );
}
