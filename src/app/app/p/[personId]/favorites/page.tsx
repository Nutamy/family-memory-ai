import { FavoritesBoard } from "@/components/favorites/favorites-board";
import { ModuleHeader, NextModuleLink } from "@/components/questionnaire/module-header";
import { TrackSection } from "@/components/questionnaire/track-section";
import { requirePerson } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModule } from "@/lib/questionnaire";

export const metadata = { title: "Любимые вещи" };

export default async function FavoritesPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  await requirePerson(personId);
  const items = await db.favoriteItem.findMany({ where: { personId }, orderBy: { createdAt: "asc" } });
  return (
    <div className="mx-auto max-w-5xl">
      <TrackSection personId={personId} slug="favorites" />
      <ModuleHeader module={getModule("favorites")!} />
      <FavoritesBoard personId={personId} initial={items.map((i) => ({ id: i.id, kind: i.kind, title: i.title, note: i.note }))} />
      <NextModuleLink personId={personId} slug="favorites" />
    </div>
  );
}
