import { PersonOverview } from "@/components/views/person-overview";
import { requirePerson } from "@/lib/auth";
import { loadProgressInput } from "@/lib/data";
import { computeProgress } from "@/lib/progress";

export default async function PersonOverviewPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const { person } = await requirePerson(personId);
  const input = await loadProgressInput(personId);
  return <PersonOverview person={person} progress={computeProgress(input)} memoriesCount={input.memoriesCount} />;
}
