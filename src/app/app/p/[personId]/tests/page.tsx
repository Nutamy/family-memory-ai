import { ModuleHeader, NextModuleLink } from "@/components/questionnaire/module-header";
import { TrackSection } from "@/components/questionnaire/track-section";
import { TestsPanel, type TestState } from "@/components/tests/test-runner";
import { requirePerson } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModule } from "@/lib/questionnaire";
import { TEST_KINDS, type TestKind } from "@/lib/tests";
import { parseJson } from "@/lib/utils";

export const metadata = { title: "Психологические тесты" };

export default async function TestsPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  await requirePerson(personId);
  const rows = await db.testResult.findMany({ where: { personId } });
  const initial = Object.fromEntries(
    TEST_KINDS.map((k) => {
      const r = rows.find((x) => x.kind === k);
      return [k, { answers: parseJson(r?.answers, {}), completed: !!r?.completed, result: parseJson(r?.result, null) }];
    }),
  ) as Record<TestKind, TestState>;

  return (
    <div className="mx-auto max-w-3xl">
      <TrackSection personId={personId} slug="tests" />
      <ModuleHeader module={getModule("tests")!} />
      <TestsPanel personId={personId} initial={initial} />
      <NextModuleLink personId={personId} slug="tests" />
    </div>
  );
}
