import Link from "next/link";
import { Bird, Leaf, Logo } from "@/components/decor";
import { StorageChoice } from "@/components/layout/storage-choice";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getSessionUserId } from "@/lib/auth";

export const metadata = { title: "Где хранить архив" };

export default async function StartPage() {
  const loggedIn = !!(await getSessionUserId());
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Leaf className="absolute left-4 top-28 w-16 -rotate-12 animate-float" />
      <Bird className="absolute right-6 top-20 hidden w-24 animate-float [animation-delay:-2s] sm:block" />
      <header className="container flex h-20 items-center justify-between">
        <Link href="/" aria-label="На главную">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <div className="container max-w-4xl py-10 text-center">
        <p className="eyebrow">Новый архив</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Где хранить воспоминания?</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">Выберите сейчас — передумать можно в любой момент.</p>
        <StorageChoice loggedIn={loggedIn} className="mt-10" />
      </div>
    </main>
  );
}
