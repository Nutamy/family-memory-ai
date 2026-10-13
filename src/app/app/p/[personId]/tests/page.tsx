import { TestsView, toTestStates } from "@/components/views/section-views";
import { requirePerson } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Психологические тесты" };

export default async function TestsPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  await requirePerson(personId);
  return <TestsView personId={personId} initial={toTestStates(await db.testResult.findMany({ where: { personId } }))} />;
}
