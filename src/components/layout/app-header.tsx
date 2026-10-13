import { HardDrive } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/decor";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

/** local: header of on-device archives — links to the account instead of showing it. */
export function AppHeader({ email, local, loggedIn }: { email?: string | null; local?: boolean; loggedIn?: boolean }) {
  const home = local ? "/local" : "/app";
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href={home} className="focus-ring rounded-lg" aria-label="Мои архивы">
          <Logo compact />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {local && (
            <span className="hidden items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-xs font-bold text-forest md:inline-flex" title="Данные хранятся только в этом браузере">
              <HardDrive className="size-3.5" /> На этом устройстве
            </span>
          )}
          <Link href={home} className="hidden rounded-full px-3 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:text-primary sm:block">
            Мои архивы
          </Link>
          {local && (
            <Link href={loggedIn ? "/app" : "/login?next=/local"} className="rounded-full px-3 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:text-primary">
              {loggedIn ? "Аккаунт" : "Войти"}
            </Link>
          )}
          {email && <span className="hidden max-w-[180px] truncate text-sm text-muted-foreground lg:block">{email}</span>}
          <ThemeToggle />
          {email && <LogoutButton />}
        </nav>
      </div>
    </header>
  );
}
