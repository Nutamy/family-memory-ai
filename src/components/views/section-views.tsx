// Section pages shared by account archives (server pages) and on-device archives (client pages).
import { FavoritesBoard } from "@/components/favorites/favorites-board";
import { MemoryBoard } from "@/components/memories/memory-board";
import { ProfileForm } from "@/components/profile/profile-form";
import { ModuleHeader, NextModuleLink } from "@/components/questionnaire/module-header";
import { QuestionCard } from "@/components/questionnaire/question-card";
import { TrackSection } from "@/components/questionnaire/track-section";
import { TestsPanel, type TestState } from "@/components/tests/test-runner";
import { VoiceArchive } from "@/components/voice/voice-archive";
import type { AnswerDTO, FavoriteDTO, MemoryDTO, VoiceRecordDTO } from "@/lib/dto";
import type { Progress } from "@/lib/progress";
import { getModule, type ModuleDef } from "@/lib/questionnaire";
import { TEST_KINDS, type TestKind } from "@/lib/tests";
import { parseJson } from "@/lib/utils";

export function toAnswerDTO(a: { questionId: string; text: string; value: string; voiceRecordId: string | null }): AnswerDTO {
  return { questionId: a.questionId, text: a.text, value: parseJson(a.value, null), voiceRecordId: a.voiceRecordId };
}

export function toTestStates(rows: { kind: string; answers: string; result: string; completed: boolean }[]) {
  return Object.fromEntries(
    TEST_KINDS.map((k) => {
      const r = rows.find((x) => x.kind === k);
      return [k, { answers: parseJson(r?.answers, {}), completed: !!r?.completed, result: parseJson(r?.result, null) }];
    }),
  ) as Record<TestKind, TestState>;
}

export interface ProfileFields {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  residence: string;
  education: string;
  profession: string;
  bio: string;
  photoKey: string | null;
}

export function ModuleView({
  personId,
  module: m,
  person,
  answers,
  records,
  progress,
}: {
  personId: string;
  module: ModuleDef;
  person: ProfileFields;
  answers: AnswerDTO[];
  records: VoiceRecordDTO[];
  progress?: Progress;
}) {
  const byQ = new Map(answers.map((a) => [a.questionId, a]));
  return (
    <div className="mx-auto max-w-3xl">
      <TrackSection personId={personId} slug={m.slug} />
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
            recordings={records.filter((r) => r.questionId === q.id)}
          />
        ))}
      </div>
      <NextModuleLink personId={personId} slug={m.slug} />
    </div>
  );
}

export function TestsView({ personId, initial }: { personId: string; initial: Record<TestKind, TestState> }) {
  return (
    <div className="mx-auto max-w-3xl">
      <TrackSection personId={personId} slug="tests" />
      <ModuleHeader module={getModule("tests")!} />
      <TestsPanel personId={personId} initial={initial} />
      <NextModuleLink personId={personId} slug="tests" />
    </div>
  );
}

export function MemoriesView({ personId, initial }: { personId: string; initial: MemoryDTO[] }) {
  return (
    <div className="mx-auto max-w-5xl">
      <TrackSection personId={personId} slug="memories" />
      <ModuleHeader module={getModule("memories")!} />
      <MemoryBoard personId={personId} initial={initial} />
      <NextModuleLink personId={personId} slug="memories" />
    </div>
  );
}

export function VoiceView({ personId, initial }: { personId: string; initial: VoiceRecordDTO[] }) {
  return (
    <div className="mx-auto max-w-4xl">
      <TrackSection personId={personId} slug="voice" />
      <ModuleHeader module={getModule("voice")!} />
      <VoiceArchive personId={personId} initial={initial} />
      <NextModuleLink personId={personId} slug="voice" />
    </div>
  );
}

export function FavoritesView({ personId, initial }: { personId: string; initial: FavoriteDTO[] }) {
  return (
    <div className="mx-auto max-w-5xl">
      <TrackSection personId={personId} slug="favorites" />
      <ModuleHeader module={getModule("favorites")!} />
      <FavoritesBoard personId={personId} initial={initial} />
      <NextModuleLink personId={personId} slug="favorites" />
    </div>
  );
}
