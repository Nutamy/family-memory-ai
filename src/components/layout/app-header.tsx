import Link from "next/link";
import { Logo } from "@/components/decor";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/app" className="focus-ring rounded-lg" aria-label="Мои архивы">
          <Logo compact />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/app" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:text-primary sm:block">
            Мои архивы
          </Link>
          {email && <span className="hidden max-w-[180px] truncate text-sm text-muted-foreground lg:block">{email}</span>}
          <ThemeToggle />
          {email && <LogoutButton />}
        </nav>
      </div>
    </header>
  );
}
