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
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      <LogOut className="size-[18px]" />
    </button>
  );
}
