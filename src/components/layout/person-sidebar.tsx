"use client";

import { BarChart3, Check, Download, LayoutGrid, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Progress, ProgressRing } from "@/components/ui/progress";
import type { ProgressSummary } from "@/lib/progress";
import { CHAPTERS, getModule, moduleHref } from "@/lib/questionnaire";
import { cn, formatMinutes } from "@/lib/utils";
import { ModuleIcon } from "./module-icon";

export function PersonSidebar({ personId, name, progress }: { personId: string; name: string; progress: ProgressSummary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const base = `/app/p/${personId}`;
  const link = (href: string, exact = false) => (exact ? pathname === href : pathname.startsWith(href));

  const nav = (
    <nav className="space-y-6">
      <div className="rounded-3xl bg-navy p-5 text-cream">
        <p className="truncate font-serif text-lg font-semibold">{name}</p>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={progress.overall.percent} className="bg-cream/15" />
          <span className="text-sm font-bold">{progress.overall.percent}%</span>
        </div>
        <p className="mt-2 text-xs text-cream/70">
          {progress.answered} из {progress.totalQuestions} ответов · {formatMinutes(progress.recordedSeconds)} мин голоса
        </p>
      </div>

      <div className="space-y-1">
        {[
          { href: base, label: "Обзор", icon: LayoutGrid, exact: true },
          { href: `${base}/report`, label: "Отчёт о личности", icon: BarChart3 },
          { href: `${base}/export`, label: "Экспорт и ИИ", icon: Download },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors",
              link(l.href, l.exact) ? "bg-card text-primary shadow-paper" : "text-foreground/75 hover:bg-card/60 hover:text-foreground",
            )}
          >
            <l.icon className="size-4" /> {l.label}
          </Link>
        ))}
      </div>

      {CHAPTERS.map((c) => (
        <div key={c.slug}>
          <div className="mb-1.5 flex items-center justify-between px-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {c.number}. {c.title}
            </p>
            <span className="text-[11px] font-bold text-muted-foreground">{progress.chapters[c.slug]?.percent ?? 0}%</span>
          </div>
          <ul className="space-y-0.5">
            {c.modules.map((slug) => {
              const m = getModule(slug)!;
              const href = moduleHref(personId, slug);
              const pct = progress.modules[slug]?.percent ?? 0;
              const active = link(href);
              return (
                <li key={slug}>
                  <Link
                    href={href}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors",
                      active ? "bg-card font-bold text-foreground shadow-paper" : "text-foreground/75 hover:bg-card/60 hover:text-foreground",
                    )}
                  >
                    <ModuleIcon name={m.icon} className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                    <span className="min-w-0 flex-1 truncate">{m.title}</span>
                    {pct >= 100 ? (
                      <span className="grid size-5 place-items-center rounded-full bg-grass text-white">
                        <Check className="size-3" />
                      </span>
                    ) : (
                      <ProgressRing value={pct} size={20} stroke={3} />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="scrollbar-none sticky top-16 hidden h-[calc(100dvh-4rem)] w-72 shrink-0 overflow-y-auto py-8 pr-2 lg:block">{nav}</aside>

      {/* Mobile: floating button + drawer */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-cream shadow-xl lg:hidden"
      >
        <Menu className="size-4" /> Разделы · {progress.overall.percent}%
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto bg-background p-5 shadow-2xl">
            <button type="button" onClick={() => setOpen(false)} className="mb-4 ml-auto flex rounded-full p-2 hover:bg-muted" aria-label="Закрыть">
              <X className="size-5" />
            </button>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
