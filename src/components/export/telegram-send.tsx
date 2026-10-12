"use client";

import { Check, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { key: "report", label: "Отчёт о личности" },
  { key: "json", label: "JSON профиля" },
  { key: "audio", label: "Аудио MP3" },
  { key: "wav", label: "Аудио WAV (оригинал)" },
] as const;

type Item = (typeof OPTIONS)[number]["key"];

export function TelegramSend({ personId, configured }: { personId: string; configured: boolean }) {
  const [items, setItems] = useState<Item[]>(["report", "json"]);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState(0);

  async function send() {
    setState("sending");
    setError(null);
    try {
      const res = await api<{ documents: number }>(`/api/persons/${personId}/telegram`, { method: "POST", json: { items } });
      setDocuments(res.documents);
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setState("error");
    }
  }

  if (!configured) {
    return (
      <p className="text-sm text-muted-foreground">
        Бот не подключён. Добавьте переменные <code className="font-mono">TELEGRAM_BOT_TOKEN</code> и{" "}
        <code className="font-mono">TELEGRAM_CHAT_ID</code> и перезапустите приложение.
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
          <span className="text-sm text-muted-foreground">Аудио уходит частями до 50 МБ — это может занять несколько минут</span>
        )}
        {error && <span className="text-sm font-semibold text-primary">{error}</span>}
      </div>
    </div>
  );
}
