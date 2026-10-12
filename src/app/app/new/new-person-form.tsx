"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { api } from "@/lib/client";

export function NewPersonForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const person = await api<{ id: string }>("/api/persons", { method: "POST", json: Object.fromEntries(new FormData(e.currentTarget)) });
      router.push(`/app/p/${person.id}/m/basic`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="firstName">Имя</Label>
        <Input id="firstName" name="firstName" required placeholder="Анна" autoFocus />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="middleName">Отчество</Label>
          <Input id="middleName" name="middleName" placeholder="Петровна" />
        </div>
        <div>
          <Label htmlFor="lastName">Фамилия</Label>
          <Input id="lastName" name="lastName" placeholder="Соколова" />
        </div>
      </div>
      {error && <p className="text-sm font-semibold text-primary">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading} arrow>
        {loading ? "Создаю…" : "Начать"}
      </Button>
    </form>
  );
}
