import { MemoriesView } from "@/components/views/section-views";
import { requirePerson } from "@/lib/auth";
import { db } from "@/lib/db";
import { memoryInclude, toMemoryDTO } from "@/lib/memories";

export const metadata = { title: "Книга воспоминаний" };

export default async function MemoriesPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  await requirePerson(personId);
  const memories = await db.memory.findMany({ where: { personId }, include: memoryInclude, orderBy: { createdAt: "desc" } });
  return <MemoriesView personId={personId} initial={memories.map(toMemoryDTO)} />;
}
