import { Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import type { ProgressSummary } from "@/lib/progress";
import { personBase } from "@/lib/questionnaire";
import { formatDate, formatMinutes } from "@/lib/utils";

export interface ArchivePerson {
  id: string;
  firstName: string;
  lastName: string;
  profession: string;
  photoKey: string | null;
  updatedAt: Date;
}

/** actions: extra controls under the card (outside the link, so buttons stay valid HTML). */
export function ArchiveCard({ person: p, progress, actions }: { person: ArchivePerson; progress: ProgressSummary; actions?: React.ReactNode }) {
  return (
    <div className="paper-card group flex flex-col transition-transform hover:-translate-y-1">
      <Link href={personBase(p.id)} className="block flex-1 p-6">
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
          <Progress value={progress.overall.percent} />
          <span className="text-sm font-bold">{progress.overall.percent}%</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {formatMinutes(progress.recordedSeconds)} мин голоса · обновлено {formatDate(p.updatedAt)}
        </p>
      </Link>
      {actions && <div className="flex flex-wrap gap-2 border-t border-border/60 px-6 py-3">{actions}</div>}
    </div>
  );
}

export function NewArchiveCard({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-foreground/15 p-6 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      <span className="grid size-14 place-items-center rounded-full bg-primary text-white shadow-lg">
        <Plus className="size-6" />
      </span>
      <span className="font-serif text-xl font-semibold">Создать профиль</span>
    </Link>
  );
}
