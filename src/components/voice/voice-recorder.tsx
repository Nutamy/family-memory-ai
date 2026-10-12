"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Mic, Pause, Play, RotateCcw, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { encodeMp3 } from "@/lib/audio/mp3";
import { useRecorder } from "@/lib/audio/use-recorder";
import type { VoiceRecordDTO } from "@/lib/dto";
import { assessQuality, QUALITY_LABELS } from "@/lib/quality";
import { cn, formatDuration } from "@/lib/utils";
import { AudioPlayer } from "./audio-player";

export interface VoiceRecorderProps {
  personId: string;
  title: string;
  topic?: string;
  questionId?: string;
  memoryId?: string;
  onSaved?: (record: VoiceRecordDTO) => void;
  /** Big centered layout for the voice archive. */
  size?: "compact" | "hero";
  label?: string;
}

export function VoiceRecorder({ personId, title, topic, questionId, memoryId, onSaved, size = "compact", label = "Ответить голосом" }: VoiceRecorderProps) {
  const rec = useRecorder();
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const hero = size === "hero";

  async function save() {
    const r = rec.recording;
    if (!r) return;
    setSaveError(null);
    try {
      setSaving("Кодирую MP3…");
      const mp3 = await encodeMp3(r.samples, r.sampleRate, 128, (p) => setSaving(`Кодирую MP3… ${Math.round(p * 100)}%`));
      setSaving("Сохраняю…");
      const form = new FormData();
      form.append("wav", r.wav, "record.wav");
      if (mp3) form.append("mp3", mp3, "record.mp3");
      form.append("title", title);
      if (topic) form.append("topic", topic);
      if (questionId) form.append("questionId", questionId);
      if (memoryId) form.append("memoryId", memoryId);
      form.append("duration", String(r.duration));
      form.append("sampleRate", String(r.sampleRate));
      form.append("peakDb", String(r.stats.peakDb));
      form.append("rmsDb", String(r.stats.rmsDb));
      form.append("clipping", String(r.stats.clipping));
      const res = await fetch(`/api/persons/${personId}/voice`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Не удалось сохранить запись");
      onSaved?.(await res.json());
      rec.reset();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(null);
    }
  }

  const active = rec.status === "recording" || rec.status === "paused";
  const quality = rec.recording ? assessQuality({ ...rec.recording.stats, sampleRate: rec.recording.sampleRate, duration: rec.recording.duration }) : null;

  return (
    <div className={cn("rounded-2xl", hero ? "text-center" : "")}>
      <AnimatePresence mode="wait" initial={false}>
        {(rec.status === "idle" || rec.status === "error" || rec.status === "requesting") && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {hero ? (
              <button
                type="button"
                onClick={rec.start}
                disabled={rec.status === "requesting"}
                className="focus-ring group relative mx-auto grid size-32 place-items-center rounded-full"
                aria-label={label}
              >
                <span className="absolute inset-0 rounded-full bg-primary/15 transition-transform group-hover:scale-110" />
                <span className="relative grid size-24 place-items-center rounded-full bg-primary text-white shadow-xl transition-transform group-hover:scale-105">
                  {rec.status === "requesting" ? <Loader2 className="size-9 animate-spin" /> : <Mic className="size-10" />}
                </span>
              </button>
            ) : (
              <Button type="button" variant="soft" size="sm" onClick={rec.start} disabled={rec.status === "requesting"}>
                {rec.status === "requesting" ? <Loader2 className="animate-spin" /> : <Mic />} {label}
              </Button>
            )}
            {hero && <p className="mt-4 font-serif text-xl font-semibold">{label}</p>}
            {rec.error && <p className="mt-3 text-sm font-semibold text-primary">{rec.error}</p>}
          </motion.div>
        )}

        {active && (
          <motion.div
            key="rec"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn("rounded-2xl border bg-background/70 p-4", hero && "mx-auto max-w-lg p-6")}
          >
            <div className={cn("flex items-center gap-3", hero && "flex-col")}>
              <span className="relative grid size-3 place-items-center">
                {rec.status === "recording" && <span className="absolute size-3 animate-pulse-ring rounded-full bg-primary" />}
                <span className={cn("size-3 rounded-full", rec.status === "recording" ? "bg-primary" : "bg-gold")} />
              </span>
              <span className={cn("font-mono tabular-nums", hero ? "text-4xl" : "text-lg")}>{formatDuration(rec.elapsed)}</span>
              <span className="text-sm text-muted-foreground">{rec.status === "paused" ? "Пауза" : "Идёт запись"}</span>
            </div>
            <div className={cn("my-3 flex items-center justify-center gap-[3px]", hero ? "h-20" : "h-10")} aria-hidden>
              {rec.levels.map((l, i) => (
                <span
                  key={i}
                  className={cn("w-1 rounded-full transition-[height] duration-75", rec.status === "paused" ? "bg-gold/50" : "bg-primary/80")}
                  style={{ height: `${Math.max(6, l * 100)}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {rec.status === "recording" ? (
                <Button type="button" variant="outline" size="sm" onClick={rec.pause}>
                  <Pause /> Пауза
                </Button>
              ) : (
                <Button type="button" variant="secondary" size="sm" onClick={rec.resume}>
                  <Play /> Продолжить
                </Button>
              )}
              <Button type="button" size="sm" onClick={rec.stop}>
                <Square className="fill-current" /> Остановить
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={rec.reset}>
                <Trash2 /> Отменить
              </Button>
            </div>
          </motion.div>
        )}

        {rec.status === "stopped" && rec.recording && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn("rounded-2xl border bg-background/70 p-4 text-left", hero && "mx-auto max-w-lg p-6")}
          >
            <p className="mb-3 text-sm font-semibold">Прослушайте запись перед сохранением</p>
            <AudioPlayer src={rec.recording.url} duration={rec.recording.duration} />
            {quality && (
              <p className="mt-2 text-xs text-muted-foreground">
                Качество: <b className={quality.level === "poor" ? "text-primary" : "text-grass"}>{QUALITY_LABELS[quality.level]}</b>
                {quality.issues.length > 0 && <> · {quality.issues.join(", ")}</>}
              </p>
            )}
            {saveError && <p className="mt-2 text-sm font-semibold text-primary">{saveError}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={save} disabled={!!saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Check />} {saving ?? "Сохранить"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={rec.start} disabled={!!saving}>
                <RotateCcw /> Перезаписать
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={rec.reset} disabled={!!saving}>
                <Trash2 /> Удалить
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
