"use client";

import { LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";

const CONFIRM_WORD = "УДАЛИТЬ";

/** hasPassword: password accounts must re-enter it to delete the account. */
export function AccountSecurity({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"all" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(method: "POST" | "DELETE", body?: object) {
    setError(null);
    const res = await fetch("/api/account", {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Что-то пошло не так");
      return false;
    }
    router.push("/");
    router.refresh();
    return true;
  }

  return (
    <section className="paper-card mt-14 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-6 text-grass" />
        <h2 className="text-2xl font-semibold">Безопасность аккаунта</h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Если входили с чужого устройства или потеряли телефон — завершите все сеансы. Удаление аккаунта стирает все архивы, записи
        голоса и фотографии без возможности восстановления; перед этим скачайте полный архив на странице «Экспорт и ИИ».
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          disabled={!!busy}
          onClick={async () => {
            setBusy("all");
            if (!(await call("POST"))) setBusy(null);
          }}
        >
          <LogOut className="size-4" /> {busy === "all" ? "Выходим…" : "Выйти на всех устройствах"}
        </Button>
        <Dialog onOpenChange={() => setError(null)}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Trash2 className="size-4" /> Удалить аккаунт
            </Button>
          </DialogTrigger>
          <DialogContent title="Удалить аккаунт навсегда?" description="Все архивы, ответы, записи голоса и фотографии будут удалены. Отменить это нельзя.">
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                setBusy("delete");
                if (!(await call("DELETE", data))) setBusy(null);
              }}
            >
              <div>
                <Label htmlFor="confirm">Чтобы подтвердить, введите слово {CONFIRM_WORD}</Label>
                <Input id="confirm" name="confirm" required autoComplete="off" maxLength={50} />
              </div>
              {hasPassword && (
                <div>
                  <Label htmlFor="delete-password">Пароль от аккаунта</Label>
                  <Input id="delete-password" name="password" type="password" required maxLength={200} autoComplete="current-password" />
                </div>
              )}
              {error && <p className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">{error}</p>}
              <Button type="submit" disabled={busy === "delete"}>
                {busy === "delete" ? "Удаляем…" : "Удалить навсегда"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {error && busy === null && <p className="mt-3 text-sm font-semibold text-primary">{error}</p>}
    </section>
  );
}
