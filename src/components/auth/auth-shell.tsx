import Link from "next/link";
import { Bird, Illustration, Leaf, Logo, Sprig } from "@/components/decor";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <Leaf className="absolute left-4 top-28 w-16 -rotate-12 animate-float" />
      <Bird className="absolute right-6 top-20 w-24 animate-float [animation-delay:-2s]" />
      <Sprig className="absolute -left-8 bottom-0 hidden w-36 opacity-80 sm:block" />
      <Illustration name="fox" className="absolute bottom-4 right-[4%] hidden w-44 lg:block xl:w-56" />
      <header className="container flex h-20 items-center justify-between">
        <Link href="/" aria-label="На главную">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <div className="container flex flex-1 items-center justify-center py-10">
        <div className="paper-card w-full max-w-md p-7 sm:p-9">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mb-6 mt-2 text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
