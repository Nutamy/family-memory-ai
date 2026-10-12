"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RecordingItem } from "@/components/voice/recording-item";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { api } from "@/lib/client";
import type { AnswerDTO, VoiceRecordDTO } from "@/lib/dto";
import type { QuestionDef } from "@/lib/questionnaire";
import { useAutosave } from "@/lib/use-autosave";
import { cn, plural, wordCount } from "@/lib/utils";
import { SaveIndicator } from "./save-indicator";

type Value = string | number | string[] | null;

function hasContent(text: string, value: Value, records: number) {
  return !!text.trim() || records > 0 || (Array.isArray(value) ? value.length > 0 : value != null && value !== "");
}

export function QuestionCard({
  personId,
  question: q,
  index,
  initial,
  recordings: initialRecordings,
}: {
  personId: string;
  question: QuestionDef;
  index: number;
  initial: AnswerDTO | null;
  recordings: VoiceRecordDTO[];
}) {
  const router = useRouter();
  const [text, setText] = useState(initial?.text ?? "");
  const [value, setValue] = useState<Value>((initial?.value as Value) ?? (q.type === "multiple_choice" ? [] : null));
  const [records, setRecords] = useState(initialRecordings);
  const answeredRef = useRef(hasContent(text, value, records.length));

  // Refresh server components (sidebar progress) only when "answered" flips.
  const syncProgress = (t: string, v: Value, n: number) => {
    const now = hasContent(t, v, n);
    if (now !== answeredRef.current) {
      answeredRef.current = now;
      router.refresh();
    }
  };

  const { state, schedule, flush } = useAutosave<{ text?: string; value?: Value }>(async (payload) => {
    await api(`/api/persons/${personId}/answers`, { method: "PUT", json: { questionId: q.id, ...payload } });
  });

  const updateText = (t: string) => {
    setText(t);
    schedule({ text: t, value });
  };
  const updateValue = (v: Value) => {
    setValue(v);
    schedule({ text, value: v });
    // Choice changes are discrete — save right away.
    setTimeout(() => void flush().then(() => syncProgress(text, v, records.length)), 0);
  };

  const words = wordCount(text);
  const answered = hasContent(text, value, records.length);
  const isVoice = q.type === "voice_answer";
  const withComment = q.type === "single_choice" || q.type === "multiple_choice";

  return (
    <article id={q.id} className="paper-card scroll-mt-24 p-5 sm:p-7">
      <header className="flex items-start gap-4">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full font-serif text-base font-semibold transition-colors",
            answered ? "bg-grass text-white" : "bg-muted text-muted-foreground",
          )}
        >
          {answered ? <Check className="size-4" /> : index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold leading-snug sm:text-2xl">{q.text}</h3>
          {q.hint && <p className="mt-1 text-sm text-muted-foreground">{q.hint}</p>}
        </div>
        <SaveIndicator state={state} />
      </header>

      <div className="mt-5 space-y-4 sm:pl-[52px]">
        {q.type === "slider" && q.slider && (
          <div className="rounded-2xl bg-background/60 p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{q.slider.minLabel}</span>
              <span className="font-serif text-3xl font-semibold text-primary">{value == null ? "—" : String(value)}</span>
              <span className="text-xs font-semibold text-muted-foreground">{q.slider.maxLabel}</span>
            </div>
            <Slider
              value={value as number | null}
              min={q.slider.min}
              max={q.slider.max}
              onChange={(v) => updateValue(v)}
              aria-label={q.text}
            />
          </div>
        )}

        {withComment && (
          <div className="flex flex-wrap gap-2" role={q.type === "single_choice" ? "radiogroup" : "group"} aria-label={q.text}>
            {q.options?.map((opt) => {
              const selected = Array.isArray(value) ? value.includes(opt) : value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role={q.type === "single_choice" ? "radio" : "checkbox"}
                  aria-checked={selected}
                  onClick={() => {
                    if (q.type === "single_choice") updateValue(selected ? null : opt);
                    else {
                      const arr = Array.isArray(value) ? value : [];
                      updateValue(selected ? arr.filter((x) => x !== opt) : [...arr, opt]);
                    }
                  }}
                  className={cn(
                    "focus-ring rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                    selected
                      ? "border-primary bg-primary text-white shadow-md"
                      : "border-border bg-background/60 text-foreground/80 hover:border-primary/40 hover:text-primary",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "text" && (
          <Input value={text} onChange={(e) => updateText(e.target.value)} onBlur={() => flush().then(() => syncProgress(text, value, records.length))} placeholder="Ваш ответ" />
        )}

        {(q.type === "textarea" || withComment || isVoice) && (
          <div>
            <Textarea
              value={text}
              onChange={(e) => updateText(e.target.value)}
              onBlur={() => flush().then(() => syncProgress(text, value, records.length))}
              placeholder={
                isVoice
                  ? "Можно записать текст фразы (необязательно)"
                  : withComment
                    ? "Объясните свой выбор, расскажите историю"
                    : "Пишите так, как рассказали бы внукам…"
              }
              className={cn(isVoice || (withComment && !q.minWords) ? "min-h-[90px]" : "")}
            />
            {(q.minWords ?? 0) > 0 && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className={cn("h-full rounded-full transition-all", words >= q.minWords! ? "bg-grass" : "bg-gold")}
                    style={{ width: `${Math.min(100, (words / q.minWords!) * 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {words} {plural(words, ["слово", "слова", "слов"])}
                  {words < q.minWords! && ` · лучше от ${q.minWords}`}
                </span>
              </div>
            )}
          </div>
        )}

        <div className={cn("space-y-3", isVoice && "rounded-2xl bg-mist/50 p-4")}>
          <VoiceRecorder
            personId={personId}
            title={q.text}
            questionId={q.id}
            label={isVoice ? "Записать голосом" : "Ответить голосом"}
            onSaved={(r) => {
              const next = [r, ...records];
              setRecords(next);
              syncProgress(text, value, next.length);
              router.refresh();
            }}
          />
          {records.map((r) => (
            <RecordingItem
              key={r.id}
              personId={personId}
              record={r}
              showTitle={false}
              onChange={(u) => setRecords((rs) => rs.map((x) => (x.id === u.id ? u : x)))}
              onDelete={(id) => {
                const next = records.filter((x) => x.id !== id);
                setRecords(next);
                syncProgress(text, value, next.length);
                router.refresh();
              }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
