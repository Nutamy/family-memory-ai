import { notFound, redirect } from "next/navigation";
import { ModuleHeader, NextModuleLink } from "@/components/questionnaire/module-header";
import { QuestionCard } from "@/components/questionnaire/question-card";
import { TrackSection } from "@/components/questionnaire/track-section";
import { ProfileForm } from "@/components/profile/profile-form";
import { requirePerson } from "@/lib/auth";
import { db } from "@/lib/db";
import { toVoiceDTO, type AnswerDTO } from "@/lib/dto";
import { loadProgressInput } from "@/lib/data";
import { computeProgress } from "@/lib/progress";
import { getModule, moduleHref } from "@/lib/questionnaire";
import { parseJson } from "@/lib/utils";

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
  const progress = computeProgress(progressInput).modules[slug];
  const byQ = new Map<string, AnswerDTO>(
    answers.map((a) => [a.questionId, { questionId: a.questionId, text: a.text, value: parseJson(a.value, null), voiceRecordId: a.voiceRecordId }]),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <TrackSection personId={personId} slug={slug} />
      <ModuleHeader module={m} progress={progress} />
      <div className="space-y-6">
        {m.withProfile && (
          <ProfileForm
            personId={personId}
            hasPhoto={!!person.photoKey}
            initial={{
              firstName: person.firstName,
              middleName: person.middleName,
              lastName: person.lastName,
              birthDate: person.birthDate,
              birthPlace: person.birthPlace,
              residence: person.residence,
              education: person.education,
              profession: person.profession,
              bio: person.bio,
            }}
          />
        )}
        {(m.questions ?? []).map((q, i) => (
          <QuestionCard
            key={q.id}
            personId={personId}
            question={q}
            index={i}
            initial={byQ.get(q.id) ?? null}
            recordings={records.filter((r) => r.questionId === q.id).map(toVoiceDTO)}
          />
        ))}
      </div>
      <NextModuleLink personId={personId} slug={slug} />
    </div>
  );
}
