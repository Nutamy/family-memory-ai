"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      title="Выйти"
      aria-label="Выйти"
      className="focus-ring grid size-10 place-items-center rounded-full text-foreground/70 hover:bg-muted hover:text-primary"
      onClick={async () => {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        const target = ((await res.json().catch(() => null)) as { redirect?: string } | null)?.redirect ?? "/";
        // The Access logout URL is served by Cloudflare, not by Next — needs a full navigation.
        if (target.startsWith("/cdn-cgi/")) return window.location.assign(target);
        router.push(target);
        router.refresh();
      }}
    >
      <LogOut className="size-[18px]" />
    </button>
  );
}
