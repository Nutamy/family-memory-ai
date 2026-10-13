"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useLocalReady } from "@/lib/local/client";

/** Renders on-device pages only once the service worker serving their API is in control. */
export function LocalGate({ children }: { children: React.ReactNode }) {
  const state = useLocalReady();
  if (state === "ready") return children;
  if (state === "pending") return <LocalLoading />;
  return (
    <main className="container py-16">
      <div className="paper-card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-semibold">Браузер не поддерживает хранение на устройстве</h1>
        <p className="mt-3 text-muted-foreground">
          Нужны Service Worker и IndexedDB: они недоступны в приватном режиме некоторых браузеров и на сайтах без HTTPS. Откройте сайт в
          обычном окне или создайте аккаунт — тогда архив будет храниться на сервере.
        </p>
        <Link href="/register" className="mt-6 inline-block font-bold text-primary hover:underline">
          Создать аккаунт →
        </Link>
      </div>
    </main>
  );
}

export function LocalLoading() {
  return (
    <div className="grid min-h-[50dvh] place-items-center text-muted-foreground">
      <Loader2 className="size-6 animate-spin" aria-label="Загрузка" />
    </div>
  );
}
