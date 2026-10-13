import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { chapterOfModule, getModule, moduleHref, nextModule, personBase, type ModuleDef } from "@/lib/questionnaire";
import type { Progress as P } from "@/lib/progress";
import { FillingGuide } from "./filling-guide";

export function ModuleHeader({ module: m, progress }: { module: ModuleDef; progress?: P }) {
  const chapter = chapterOfModule(m.slug);
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="eyebrow">{chapter ? `Глава ${chapter.number} · ${chapter.title}` : "Архив"}</p>
        <FillingGuide />
      </div>
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{m.title}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{m.subtitle}</p>
      {progress && (
        <div className="mt-5 flex max-w-md items-center gap-3">
          <Progress value={progress.percent} />
          <span className="shrink-0 text-sm font-bold text-muted-foreground">{progress.percent}%</span>
        </div>
      )}
    </div>
  );
}

export function NextModuleLink({ personId, slug }: { personId: string; slug: string }) {
  const next = nextModule(slug);
  const m = next ? getModule(next) : null;
  return (
    <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-dashed p-8 text-center">
      {m ? (
        <>
          <p className="text-muted-foreground">Ответы сохраняются автоматически. Следующий раздел:</p>
          <Button asChild size="lg">
            <Link href={moduleHref(personId, m.slug)}>
              {m.title} <ArrowRight />
            </Link>
          </Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground">Это последний раздел. Посмотрите, что получилось:</p>
          <Button asChild size="lg">
            <Link href={`${personBase(personId)}/report`}>
              Отчёт о личности <ArrowRight />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
