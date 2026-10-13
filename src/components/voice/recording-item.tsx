"use client";

import { ChevronDown, Download, FileText, Loader2, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { api } from "@/lib/client";
import type { VoiceRecordDTO } from "@/lib/dto";
import { assessQuality, QUALITY_LABELS } from "@/lib/quality";
import { cn, formatDate } from "@/lib/utils";
import { AudioPlayer } from "./audio-player";

export function RecordingItem({
  personId,
  record,
  onChange,
  onDelete,
  showTitle = true,
}: {
  personId: string;
  record: VoiceRecordDTO;
  onChange?: (r: VoiceRecordDTO) => void;
  onDelete?: (id: string) => void;
  showTitle?: boolean;
}) {
  const base = `/api/persons/${personId}/voice/${record.id}`;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(record.transcription);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const quality = assessQuality(record);

  async function saveTranscription() {
    if (text === record.transcription) return;
    const r = await api<VoiceRecordDTO>(base, { method: "PATCH", json: { transcription: text } });
    onChange?.(r);
  }

  async function transcribe() {
    setBusy("transcribe");
    setError(null);
    try {
      const r = await api<VoiceRecordDTO>(`${base}/transcribe`, { method: "POST" });
      setText(r.transcription);
      onChange?.(r);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Удалить запись безвозвратно?")) return;
    setBusy("delete");
    await api(base, { method: "DELETE" }).catch(() => null);
    onDelete?.(record.id);
  }

  return (
    <div className="rounded-2xl border bg-background/50 p-3 sm:p-4">
      {showTitle && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="font-semibold">{record.title}</p>
          {record.topic && <Badge color="gold">{record.topic}</Badge>}
          <Badge color={quality.level === "poor" ? "terracotta" : "grass"} title={quality.issues.join(", ")}>
            {QUALITY_LABELS[quality.level]}
          </Badge>
          <span className="ml-auto text-xs text-muted-foreground">{formatDate(record.createdAt)}</span>
        </div>
      )}
      <AudioPlayer src={`${base}?format=${record.hasMp3 ? "mp3" : "wav"}`} duration={record.duration} />
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="sm" asChild>
          <a href={`${base}?format=wav&download=1`}>
            <Download /> WAV
          </a>
        </Button>
        {record.hasMp3 && (
          <Button variant="ghost" size="sm" asChild>
            <a href={`${base}?format=mp3&download=1`}>
              <Download /> MP3
            </a>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
          <FileText /> Расшифровка <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
        </Button>
        <Button variant="ghost" size="sm" onClick={transcribe} disabled={!!busy} title="Автоматическая расшифровка речи в текст">
          {busy === "transcribe" ? <Loader2 className="animate-spin" /> : <Wand2 />} Авто
        </Button>
        <Button variant="danger" size="sm" onClick={remove} disabled={!!busy} className="ml-auto">
          <Trash2 /> Удалить
        </Button>
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-primary">{error}</p>}
      {open && (
        <Textarea
          className="mt-2 min-h-[100px] text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={saveTranscription}
          placeholder="Текст записи — пригодится для ИИ-персоны и подсчёта слов"
        />
      )}
    </div>
  );
}
