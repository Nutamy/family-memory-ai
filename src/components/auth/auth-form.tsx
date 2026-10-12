"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || (mode === "register" ? "/app/new" : "/app");
  const [error, setError] = useState<string | null>(null);
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
      setLoading(false);
      return;
    }
    router.push(next.startsWith("/") ? next : "/app");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" && (
        <div>
          <Label htmlFor="name">Как к вам обращаться</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Анна" />
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </div>
      <div>
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="Не короче 6 символов"
        />
      </div>
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
      <div className="pt-2">
        <p className="mb-2 text-center text-xs uppercase tracking-widest text-muted-foreground">Скоро</p>
        <div className="grid grid-cols-3 gap-2">
          {["Google", "Microsoft", "Apple"].map((p) => (
            <button key={p} type="button" disabled className="h-10 cursor-not-allowed rounded-full border text-sm font-semibold text-muted-foreground opacity-60">
              {p}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
