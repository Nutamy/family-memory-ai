"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bird, Illustration, Leaf } from "@/components/decor";
import { Input } from "@/components/ui/input";
import type { VoiceRecordDTO } from "@/lib/dto";
import { VOICE_TOPICS } from "@/lib/questionnaire";
import { cn, formatMinutes, plural } from "@/lib/utils";
import { RecordingItem } from "./recording-item";
import { VoiceRecorder } from "./voice-recorder";

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "free", label: "Свободные рассказы" },
  { key: "answers", label: "Ответы на вопросы" },
  { key: "memories", label: "К воспоминаниям" },
] as const;

export function VoiceArchive({ personId, initial }: { personId: string; initial: VoiceRecordDTO[] }) {
  const router = useRouter();
  const [records, setRecords] = useState(initial);
  const [topic, setTopic] = useState(VOICE_TOPICS[0]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const seconds = records.reduce((s, r) => s + r.duration, 0);
  const visible = records.filter((r) =>
    filter === "all" ? true : filter === "free" ? !r.questionId && !r.memoryId : filter === "answers" ? !!r.questionId : !!r.memoryId,
  );

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-navy px-5 py-10 text-cream sm:px-10">
        <Bird className="absolute right-6 top-6 hidden w-24 opacity-90 md:block" />
        <Leaf className="absolute -left-2 bottom-6 w-14 rotate-[-30deg] opacity-80" />
        <Illustration name="moon" className="absolute left-6 top-6 w-10" />
        {/* Beside the recorder card, above the tip line: lower it overlapped the tip text. */}
        <Illustration name="bee-trail" className="absolute bottom-28 right-6 hidden w-40 opacity-80 xl:block" />
        <div className="relative mx-auto max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-honey">Говорите свободно</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Записать воспоминание</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {VOICE_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  topic === t ? "border-honey bg-honey text-navy" : "border-cream/25 text-cream/80 hover:border-honey",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Название записи (по умолчанию «${topic}»)`}
            className="mx-auto mt-5 max-w-md border-cream/20 bg-cream/10 text-center text-cream placeholder:text-cream/50 focus:bg-cream/15"
          />
          <div className="mx-auto mt-8 max-w-md rounded-[2rem] bg-card p-6 text-foreground shadow-2xl sm:p-8">
            <VoiceRecorder
              personId={personId}
              size="hero"
              title={title.trim() || topic}
              topic={topic}
              label="Нажмите и начните рассказ"
              onSaved={(r) => {
                setRecords((rs) => [r, ...rs]);
                setTitle("");
                router.refresh();
              }}
            />
          </div>
          <p className="mt-6 text-sm text-cream/60">
            Совет: тихая комната, телефон или микрофон в 20–30 см от лица. Для голосового клона нужны чистые записи без музыки и шума.
          </p>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">Все записи</h2>
            <p className="text-muted-foreground">
              {records.length} {plural(records.length, ["запись", "записи", "записей"])} · {formatMinutes(seconds)} мин
            </p>
          </div>
          <div className="scrollbar-none flex gap-1 overflow-x-auto rounded-full border bg-card/70 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {visible.map((r) => (
            <RecordingItem
              key={r.id}
              personId={personId}
              record={r}
              onChange={(u) => setRecords((rs) => rs.map((x) => (x.id === u.id ? u : x)))}
              onDelete={(id) => {
                setRecords((rs) => rs.filter((x) => x.id !== id));
                router.refresh();
              }}
            />
          ))}
          {visible.length === 0 && <p className="rounded-3xl border-2 border-dashed p-8 text-center text-muted-foreground">Пока нет записей.</p>}
        </div>
      </section>
    </div>
  );
}
