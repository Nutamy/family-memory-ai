"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Guest mode: one button instead of a sign-up form. */
export function GuestStart({ turnstileSiteKey }: { turnstileSiteKey?: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Что-то пошло не так");
      window.turnstile?.reset();
      setLoading(false);
      return;
    }
    const next = params.get("next");
    router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/app/new");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-5">
      {params.get("expired") && (
        <p className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          Ссылка устарела или неверна. Начните заново или попросите новую ссылку у бота.
        </p>
      )}
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>• Регистрация не нужна — просто начните заполнять.</li>
        <li>• Ответы сохраняются автоматически, можно делать перерывы.</li>
        <li>• Подключите Telegram: бот пришлёт результаты и ссылку, чтобы продолжить с любого устройства.</li>
      </ul>
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Не заполняйте это поле
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div className="cf-turnstile flex justify-center" data-sitekey={turnstileSiteKey} data-language="ru" data-theme="auto" />
        </>
      )}
      {error && <p className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">{error}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={loading} arrow>
        {loading ? "Подождите…" : "Начать заполнение"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">Уже начинали? Откройте ссылку «Продолжить», которую прислал бот.</p>
    </form>
  );
}
