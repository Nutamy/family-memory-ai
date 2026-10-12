import { MemoryBoard } from "@/components/memories/memory-board";
import { ModuleHeader, NextModuleLink } from "@/components/questionnaire/module-header";
import { TrackSection } from "@/components/questionnaire/track-section";
import { requirePerson } from "@/lib/auth";
import { db } from "@/lib/db";
import { memoryInclude, toMemoryDTO } from "@/lib/memories";
import { getModule } from "@/lib/questionnaire";

export const metadata = { title: "Книга воспоминаний" };

export default async function MemoriesPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  await requirePerson(personId);
  const memories = await db.memory.findMany({ where: { personId }, include: memoryInclude, orderBy: { createdAt: "desc" } });
  return (
    <div className="mx-auto max-w-5xl">
      <TrackSection personId={personId} slug="memories" />
      <ModuleHeader module={getModule("memories")!} />
      <MemoryBoard personId={personId} initial={memories.map(toMemoryDTO)} />
      <NextModuleLink personId={personId} slug="memories" />
    </div>
  );
}
