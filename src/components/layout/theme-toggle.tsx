"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const THEME_KEY = "fm-theme";

/** Runs before hydration to avoid a flash of the wrong theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Светлая тема" : "Тёмная тема"}
      title={dark ? "Светлая тема" : "Тёмная тема"}
      className={cn("focus-ring grid size-10 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground", className)}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
