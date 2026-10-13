import { ArrowRight, BookHeart, Clock, MessageSquareText, UserRound } from "lucide-react";
import Link from "next/link";
import { Illustration, Leaf } from "@/components/decor";
import { ModuleIcon } from "@/components/layout/module-icon";
import { Button } from "@/components/ui/button";
import { Progress, ProgressRing } from "@/components/ui/progress";
import type { ProgressSummary } from "@/lib/progress";
import { CHAPTERS, getModule, MODULE_SEQUENCE, moduleHref } from "@/lib/questionnaire";
import { ageFromBirthDate, formatMinutes, plural } from "@/lib/utils";

export interface OverviewPerson {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  profession: string;
  residence: string;
  photoKey: string | null;
  lastSection: string | null;
}

/** Person dashboard; rendered by the account page (server) and the on-device page (client). */
export function PersonOverview({ person, progress, memoriesCount }: { person: OverviewPerson; progress: ProgressSummary; memoriesCount: number }) {
  const personId = person.id;
  const age = ageFromBirthDate(person.birthDate);
  const firstIncomplete = MODULE_SEQUENCE.find((s) => (progress.modules[s]?.percent ?? 0) < 100);
  const continueSlug = person.lastSection && (progress.modules[person.lastSection]?.percent ?? 0) < 100 ? person.lastSection : firstIncomplete;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-navy p-6 text-cream sm:p-10">
        <Illustration name="moon" className="absolute right-6 top-6 w-10 sm:w-14" />
        <Illustration name="star-small" className="absolute right-20 top-16 w-4 sm:right-28" />
        <Illustration name="bear" className="absolute -bottom-2 right-[30%] hidden w-40 opacity-95 xl:block" />
        <Leaf className="absolute -bottom-4 right-1/3 w-16 rotate-45 opacity-70" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="size-28 shrink-0 rotate-[-3deg] rounded-2xl bg-cream p-1.5 shadow-xl">
            {person.photoKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/persons/${personId}/photo`} alt="" className="size-full rounded-xl object-cover" />
            ) : (
              <div className="grid size-full place-items-center rounded-xl bg-mist text-forest/60">
                <UserRound className="size-12" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-honey">Цифровой архив</p>
            <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">
              {person.firstName} {person.middleName} {person.lastName}
            </h1>
            <p className="mt-2 text-cream/75">
              {[age && `${age} ${plural(age, ["год", "года", "лет"])}`, person.profession, person.residence].filter(Boolean).join(" · ") ||
                "Начните с основной информации"}
            </p>
          </div>
        </div>
        <div className="relative mt-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-5xl font-semibold">{progress.overall.percent}%</span>
              <span className="text-cream/70">архива заполнено</span>
            </div>
            <Progress value={progress.overall.percent} className="mt-3 h-2.5 bg-cream/15" />
          </div>
          {continueSlug && (
            <Button asChild size="lg" variant="secondary">
              <Link href={moduleHref(personId, continueSlug)}>
                Продолжить: {getModule(continueSlug)?.title} <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: MessageSquareText, value: `${progress.answered} / ${progress.totalQuestions}`, label: "ответов на вопросы" },
          { icon: Clock, value: formatMinutes(progress.recordedSeconds), label: `мин голоса · ${progress.recordings} ${plural(progress.recordings, ["запись", "записи", "записей"])}` },
          { icon: BookHeart, value: String(memoriesCount), label: plural(memoriesCount, ["воспоминание", "воспоминания", "воспоминаний"]) },
        ].map((s) => (
          <div key={s.label} className="paper-card flex items-center gap-4 p-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-mist text-forest">
              <s.icon className="size-5" />
            </span>
            <div>
              <p className="font-serif text-2xl font-semibold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-8">
        {CHAPTERS.map((c) => (
          <div key={c.slug}>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Глава {c.number}</p>
                <h2 className="text-3xl font-semibold">{c.title}</h2>
              </div>
              <span className="text-sm font-bold text-muted-foreground">{progress.chapters[c.slug]?.percent ?? 0}%</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {c.modules.map((slug) => {
                const m = getModule(slug)!;
                const pct = progress.modules[slug]?.percent ?? 0;
                return (
                  <Link key={slug} href={moduleHref(personId, slug)} className="paper-card group flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5">
                    <div className="relative grid place-items-center">
                      <ProgressRing value={pct} size={52} />
                      <ModuleIcon name={m.icon} className="absolute size-5 text-foreground/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-lg font-semibold group-hover:text-primary">{m.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{m.subtitle}</p>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground">{pct}%</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
