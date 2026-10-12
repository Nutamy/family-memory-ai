"use client";

import { Check, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";

/** Deep-link flow: open the bot, press Start, the webhook links the chat; this polls until it does. */
export function TelegramConnect({ connected: initial, onConnected }: { connected: boolean; onConnected?: () => void }) {
  const [connected, setConnected] = useState(initial);
  const [link, setLink] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  async function connect() {
    setError(null);
    // Open the window synchronously: browsers block popups opened after an await.
    const win = window.open("", "_blank");
    try {
      const { url } = await api<{ url: string }>("/api/me/telegram", { method: "POST" });
      setLink(url);
      if (win) win.location.href = url;
      setWaiting(true);
      const started = Date.now();
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(async () => {
        const res = await api<{ connected: boolean }>("/api/me/telegram").catch(() => null);
        if (res?.connected) {
          clearInterval(timer.current!);
          setWaiting(false);
          setConnected(true);
          onConnected?.();
        } else if (Date.now() - started > 5 * 60_000) {
          clearInterval(timer.current!);
          setWaiting(false);
        }
      }, 2500);
    } catch (e) {
      win?.close();
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  }

  if (connected) {
    return (
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-grass">
        <Check className="size-4" /> Telegram подключён — бот прислал ссылку, чтобы продолжить с любого устройства
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Нажмите кнопку — откроется наш бот в Telegram.</li>
        <li>
          Нажмите в боте <b>«Старт»</b> (Start).
        </li>
        <li>Вернитесь на эту страницу — подключение появится само.</li>
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={connect} disabled={waiting}>
          {waiting ? <Loader2 className="animate-spin" /> : <Send />} {waiting ? "Жду нажатия «Старт»…" : "Подключить Telegram"}
        </Button>
        {link && waiting && (
          <a href={link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary underline">
            Бот не открылся? Нажмите здесь
          </a>
        )}
      </div>
      {error && <p className="text-sm font-semibold text-primary">{error}</p>}
    </div>
  );
}
