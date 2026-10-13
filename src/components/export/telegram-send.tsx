"use client";

import { Check, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { key: "report", label: "Отчёт о личности" },
  { key: "json", label: "Данные профиля (JSON)" },
  { key: "audio", label: "Аудио MP3" },
  { key: "wav", label: "Аудио WAV (без сжатия)" },
] as const;

type Item = (typeof OPTIONS)[number]["key"];

export function TelegramSend({ personId, configured }: { personId: string; configured: boolean }) {
  const [items, setItems] = useState<Item[]>(["report", "json"]);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function send() {
    setState("sending");
    setError(null);
    try {
      // The server sends audio a few files per request (Workers limits); keep asking until done.
      let cursor: number | null = 0;
      let sent = 0;
      setProgress(null);
      while (cursor !== null) {
        const res: { documents: number; next: number | null; total: number } = await api(`/api/persons/${personId}/telegram`, {
          method: "POST",
          json: { items, cursor },
        });
        sent += res.documents;
        setDocuments(sent);
        if (res.total) setProgress({ done: res.next ?? res.total, total: res.total });
        cursor = res.next;
      }
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setState("error");
    }
  }

  if (!configured) {
    return (
      <p className="text-sm text-muted-foreground">
        Отправка в Telegram для этого аккаунта не включена. Её подключает администратор сайта.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => {
          const on = items.includes(o.key);
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={on}
              onClick={() => setItems((l) => (on ? l.filter((x) => x !== o.key) : [...l, o.key]))}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                on ? "border-primary bg-primary text-white" : "hover:border-primary/40",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={send} disabled={!items.length || state === "sending"}>
          {state === "sending" ? <Loader2 className="animate-spin" /> : <Send />} Отправить в Telegram
        </Button>
        {state === "done" && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-grass">
            <Check className="size-4" /> Отправлено{documents > 1 ? ` (${documents} файлов)` : ""}
          </span>
        )}
        {state === "sending" && items.some((i) => i === "audio" || i === "wav") && (
          <span className="text-sm text-muted-foreground">
            {progress ? `Аудио: ${progress.done} из ${progress.total}` : "Готовлю аудио"} — файлы уходят по одному, это может занять несколько минут
          </span>
        )}
        {error && <span className="text-sm font-semibold text-primary">{error}</span>}
      </div>
    </div>
  );
}
