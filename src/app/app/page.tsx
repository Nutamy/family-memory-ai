import Link from "next/link";
import { DecorScatter } from "@/components/decor";
import { Button } from "@/components/ui/button";
import { ArchiveCard, NewArchiveCard } from "@/components/views/archive-card";
import { requireUser } from "@/lib/auth";
import { loadProgressInput } from "@/lib/data";
import { db } from "@/lib/db";
import { computeProgress } from "@/lib/progress";

export const metadata = { title: "Мои архивы" };

export default async function ArchivesPage() {
  const user = await requireUser();
  const persons = await db.person.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  const progress = await Promise.all(persons.map(async (p) => computeProgress(await loadProgressInput(p.id))));

  return (
    <main className="container relative py-12">
      <DecorScatter variant="quiet" />
      <div className="relative">
        <p className="eyebrow">Семейный архив</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Чьи истории вы сохраняете</h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
          Создайте отдельный профиль для каждого человека — себя, мамы, дедушки. Возвращайтесь в любой момент.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {persons.map((p, i) => (
            <ArchiveCard key={p.id} person={p} progress={progress[i]} />
          ))}
          <NewArchiveCard href="/app/new" />
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          {persons.length > 0 && (
            <Button asChild variant="secondary" arrow>
              <Link href="/continue">Продолжить заполнение</Link>
            </Button>
          )}
          <Link href="/local" className="text-sm font-semibold text-muted-foreground hover:text-primary">
            Архивы на этом устройстве →
          </Link>
        </div>
      </div>
    </main>
  );
}
