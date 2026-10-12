import { PersonSidebar } from "@/components/layout/person-sidebar";
import { requirePerson } from "@/lib/auth";
import { loadProgressInput } from "@/lib/data";
import { computeProgress } from "@/lib/progress";

export default async function PersonLayout({ children, params }: { children: React.ReactNode; params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const { person } = await requirePerson(personId);
  const progress = computeProgress(await loadProgressInput(personId));
  return (
    <div className="container flex gap-8">
      <PersonSidebar personId={personId} name={`${person.firstName} ${person.lastName}`.trim()} progress={progress} />
      <main className="min-w-0 flex-1 py-8 pb-28 sm:py-10">{children}</main>
    </div>
  );
}
