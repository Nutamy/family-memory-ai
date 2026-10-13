"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

declare global {
  interface Window {
    turnstile?: { reset: (el?: string | HTMLElement) => void };
  }
}

// Reasons passed back by /api/auth/google/callback as ?error=.
const GOOGLE_ERRORS: Record<string, string> = {
  google_off: "Вход через Google не настроен на сервере",
  google_cancel: "Вход через Google отменён",
  google_state: "Сессия входа устарела — попробуйте ещё раз",
  google_failed: "Не удалось войти через Google — попробуйте ещё раз",
};

/** turnstileSiteKey is set only when the server enforces Cloudflare Turnstile; google — when OAuth keys are configured. */
export function AuthForm({ mode, turnstileSiteKey, google }: { mode: "login" | "register"; turnstileSiteKey?: string | null; google: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || (mode === "register" ? "/app/new" : "/app");
  const [error, setError] = useState<string | null>(GOOGLE_ERRORS[params.get("error") ?? ""] ?? null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Что-то пошло не так");
      // A Turnstile token is single-use: get a fresh one for the next attempt.
      window.turnstile?.reset();
      setLoading(false);
      return;
    }
    router.push(next.startsWith("/") ? next : "/app");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-4">
      {google && (
        <>
          {/* A plain link: the server redirects to Google, so no JS or form-action CSP exception is needed. */}
          <a
            href={`/api/auth/google?next=${encodeURIComponent(next)}`}
            className="focus-ring flex h-12 w-full items-center justify-center gap-3 rounded-full border bg-card text-[15px] font-bold transition-colors hover:border-primary/50"
          >
            <GoogleIcon /> {mode === "login" ? "Войти через Google" : "Продолжить с Google"}
          </a>
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> или по email <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      {mode === "register" && (
        <div>
          <Label htmlFor="name">Как к вам обращаться</Label>
          <Input id="name" name="name" autoComplete="name" maxLength={100} placeholder="Анна" />
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" />
      </div>
      <div>
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          maxLength={200}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "register" ? "Не короче 8 символов" : "Ваш пароль"}
        />
      </div>
      {/* Honeypot: invisible to people, filled in by naive bots (checked in src/lib/security/form-guard.ts). */}
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
        {loading ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Нет аккаунта?{" "}
            <Link href={`/register${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-primary hover:underline">
              Зарегистрируйтесь
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Войти
            </Link>
          </>
        )}
      </p>
      <p className="border-t pt-4 text-center text-sm text-muted-foreground">
        Не хотите регистрироваться?{" "}
        <Link href="/local" className="font-bold text-primary hover:underline">
          Храните архив на этом устройстве
        </Link>
      </p>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
