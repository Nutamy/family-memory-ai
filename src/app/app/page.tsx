import { Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { DecorScatter } from "@/components/decor";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { loadProgressInput } from "@/lib/data";
import { db } from "@/lib/db";
import { computeProgress } from "@/lib/progress";
import { formatDate, formatMinutes } from "@/lib/utils";

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
            <Link key={p.id} href={`/app/p/${p.id}`} className="paper-card group block p-6 transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="size-16 shrink-0 rotate-[-3deg] rounded-xl bg-card p-1 shadow-device">
                  {p.photoKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/persons/${p.id}/photo`} alt="" className="size-full rounded-lg object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center rounded-lg bg-mist text-forest/60">
                      <UserRound className="size-7" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-semibold group-hover:text-primary">
                    {p.firstName} {p.lastName}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">{p.profession || "Профиль"}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Progress value={progress[i].overall.percent} />
                <span className="text-sm font-bold">{progress[i].overall.percent}%</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {formatMinutes(progress[i].recordedSeconds)} мин голоса · обновлено {formatDate(p.updatedAt)}
              </p>
            </Link>
          ))}
          <Link
            href="/app/new"
            className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-foreground/15 p-6 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <span className="grid size-14 place-items-center rounded-full bg-primary text-white shadow-lg">
              <Plus className="size-6" />
            </span>
            <span className="font-serif text-xl font-semibold">Создать профиль</span>
          </Link>
        </div>
        {persons.length > 0 && (
          <div className="mt-10">
            <Button asChild variant="secondary" arrow>
              <Link href="/continue">Продолжить заполнение</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
