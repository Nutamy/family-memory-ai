import { FavoritesView } from "@/components/views/section-views";
import { requirePerson } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Любимые вещи" };

export default async function FavoritesPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  await requirePerson(personId);
  const items = await db.favoriteItem.findMany({ where: { personId }, orderBy: { createdAt: "asc" } });
  return <FavoritesView personId={personId} initial={items.map((i) => ({ id: i.id, kind: i.kind, title: i.title, note: i.note }))} />;
}
