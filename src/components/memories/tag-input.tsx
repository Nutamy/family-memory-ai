"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { DEFAULT_TAGS } from "@/lib/questionnaire";
import { cn } from "@/lib/utils";

export function TagInput({ value, onChange, known }: { value: string[]; onChange: (tags: string[]) => void; known: string[] }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const t = raw.replace(/^#/, "").trim();
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setDraft("");
  };
  const pool = [...new Set([...known, ...DEFAULT_TAGS])].filter(
    (t) => !value.includes(t) && (!draft || t.toLowerCase().includes(draft.toLowerCase())),
  );

  return (
    <div>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-2xl border bg-background/60 px-3 py-2 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1.5 text-sm font-bold text-primary">
            #{t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="rounded-full p-0.5 hover:bg-primary/20" aria-label={`Убрать ${t}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? "" : "Добавьте теги: Enter или запятая"}
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </div>
      {pool.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pool.slice(0, 12).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => add(t)}
              className={cn("rounded-full border border-dashed px-2.5 py-0.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary")}
            >
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
