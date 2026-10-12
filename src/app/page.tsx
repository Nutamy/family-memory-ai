import { AudioLines, BookHeart, Brain, Download, Gem, Mic, Play, ShieldCheck, Sparkles as SparklesIcon } from "lucide-react";
import Link from "next/link";
import { Berries, Bird, BrushDivider, Butterfly, Illustration, Leaf, Logo, Sparkles, Sprig } from "@/components/decor";
import { Reveal } from "@/components/layout/reveal";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { getSessionUserId } from "@/lib/auth";
import { authMode } from "@/lib/auth-mode";
import { cloudflareEnv } from "@/lib/cloudflare";
import { CHAPTERS } from "@/lib/questionnaire";

const FEATURES = [
  { icon: Mic, title: "Голос", text: "Запись в браузере, WAV и MP3, готовые для голосового клона ElevenLabs." },
  { icon: BookHeart, title: "Воспоминания", text: "Книга историй с тегами, местами, людьми и эмоциями." },
  { icon: Gem, title: "Ценности", text: "Развёрнутые ответы о счастье, любви, дружбе и выборе." },
  { icon: Brain, title: "Психологический профиль", text: "Big Five, MBTI, темперамент и поведенческие сценарии." },
];

export default async function HomePage() {
  const loggedIn = !!(await getSessionUserId());
  const onCloudflare = !!cloudflareEnv()?.DB;

  return (
    <main className="overflow-hidden">
      <header className="container flex h-20 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-3">
          <a href="#chapters" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-foreground/70 hover:text-primary sm:block">
            Разделы
          </a>
          <a href="#voice" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-foreground/70 hover:text-primary sm:block">
            Голос
          </a>
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href={loggedIn ? "/app" : "/login"}>{loggedIn ? "Мои архивы" : authMode() === "guest" ? "Начать" : "Войти"}</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <Leaf className="absolute -left-6 top-6 w-20 -rotate-12 animate-float sm:left-6 sm:w-24" />
        <Bird className="absolute right-2 top-0 w-24 animate-float [animation-delay:-3s] sm:right-16 sm:w-32" />
        <Sprig className="absolute -left-10 bottom-0 hidden w-40 opacity-80 lg:block" />
        <Berries className="absolute -right-4 bottom-16 hidden w-20 lg:block" />
        <Sparkles className="absolute left-[18%] top-[55%] hidden w-16 opacity-80 md:block" />

        <div className="container relative pb-16 pt-10 text-center sm:pb-24 sm:pt-16">
          <Reveal>
            <p className="eyebrow mb-5">Цифровой архив личности</p>
            <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.05] sm:text-7xl">
              Family Memory <span className="italic text-primary">AI</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Сохраните историю человека, его голос, воспоминания и жизненную мудрость для будущих поколений.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={loggedIn ? "/app/new" : "/register"}>
                Создать профиль <span aria-hidden>→</span>
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/continue">
                Продолжить заполнение <span aria-hidden>→</span>
              </Link>
            </Button>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-grass" /> Прогресс сохраняется автоматически — можно вернуться в любой момент
            </p>
          </Reveal>

          {/* Device mockup */}
          <Reveal delay={0.35} className="relative mx-auto mt-16 max-w-3xl">
            <div className="relative rounded-[2.2rem] bg-card p-3 shadow-device sm:p-4">
              <div className="overflow-hidden rounded-[1.6rem] border bg-background">
                <div className="grid gap-4 p-5 text-left sm:grid-cols-[1.2fr_1fr] sm:p-8">
                  <div>
                    <p className="eyebrow">Глава 4 · Воспоминания</p>
                    <h3 className="mt-2 text-2xl font-semibold">Самый счастливый момент детства</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                      «Летом мы уезжали к бабушке в деревню. Утром пахло парным молоком и мокрой травой, а вечером дед учил меня
                      различать созвездия…»
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Детство", "Семья", "Лето"].map((t) => (
                        <span key={t} className="rounded-full bg-mist px-3 py-1 text-xs font-bold text-forest">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-navy p-6 text-cream">
                    <span className="grid size-16 place-items-center rounded-full bg-terracotta shadow-lg">
                      <Play className="ml-1 size-7 fill-white text-white" />
                    </span>
                    <div className="flex h-10 items-end gap-1" aria-hidden>
                      {[6, 14, 22, 12, 30, 18, 26, 10, 20, 34, 16, 24, 8, 18, 28, 12].map((h, i) => (
                        <span key={i} className="w-1.5 rounded-full bg-honey/80" style={{ height: h }} />
                      ))}
                    </div>
                    <p className="text-sm opacity-80">Голосовое воспоминание · 3:42</p>
                  </div>
                </div>
              </div>
            </div>
            <Butterfly className="absolute -right-6 -top-8 w-14 animate-float [animation-delay:-1s]" />
            <Illustration name="fox" priority className="absolute -bottom-10 -left-40 hidden w-44 lg:block xl:-left-52 xl:w-52" />
            <Illustration name="mushrooms" className="absolute -bottom-6 -right-28 hidden w-24 lg:block" />
          </Reveal>
        </div>
        <BrushDivider tone="green" />
      </section>

      {/* Features */}
      <section className="relative bg-[#2D4B39] py-20 text-cream dark:bg-[#16261d]">
        <Illustration name="bunny" className="absolute -top-6 right-[6%] hidden w-40 md:block lg:w-48" />
        <div className="container">
          <Reveal>
            <h2 className="max-w-2xl text-4xl font-semibold sm:text-5xl">Всё, из чего состоит человек</h2>
            <p className="mt-4 max-w-xl text-lg text-cream/75">
              Биография, мировоззрение, привычки, стиль общения, эмоциональные реакции и голос — в одном тёплом семейном архиве.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-cream/15 bg-cream/[.06] p-6 backdrop-blur">
                  <f.icon className="size-7 text-honey" />
                  <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-cream/75">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <BrushDivider tone="green" className="rotate-180" />

      {/* Chapters */}
      <section id="chapters" className="relative py-20">
        <Illustration name="squirrel" className="absolute right-4 top-6 w-24 sm:right-[8%] sm:w-36" />
        <Leaf className="absolute left-4 top-4 w-12 rotate-45 opacity-80" color="#C15C46" />
        <div className="container">
          <Reveal>
            <p className="eyebrow">Семь глав жизни</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-semibold sm:text-5xl">Анкета, похожая на семейный альбом</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {CHAPTERS.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 3) * 0.08}>
                <div className="paper-card h-full p-6 transition-transform hover:-translate-y-1">
                  <span className="font-serif text-5xl font-semibold text-gold/80">{String(c.number).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-2xl font-semibold">{c.title}</h3>
                  <p className="mt-2 text-muted-foreground">{c.description}</p>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.16}>
              <div className="flex h-full flex-col justify-between rounded-3xl bg-primary p-6 text-white">
                <SparklesIcon className="size-8" />
                <div>
                  <h3 className="mt-6 text-2xl font-semibold">Personality Report</h3>
                  <p className="mt-2 text-white/85">Портрет личности, ценности, Big Five и карта приоритетов — в графиках.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Voice */}
      <section id="voice" className="relative">
        <BrushDivider tone="blue" />
        <div className="relative bg-navy py-20 text-cream">
          <Illustration name="moon" className="absolute right-[6%] top-6 w-12 sm:w-16" />
          <Illustration name="star-small" className="absolute right-[14%] top-16 w-5" />
          <Illustration name="star" className="absolute left-[46%] top-10 hidden w-6 lg:block" />
          <Illustration name="bear" className="absolute bottom-0 left-[38%] hidden w-44 xl:block" />
          <div className="container grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-honey">Голосовой архив</p>
              <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">Голос, который можно услышать снова</h2>
              <p className="mt-5 text-lg leading-relaxed text-cream/75">
                Записывайте рассказы, поздравления и слова поддержки прямо в браузере. Пауза, продолжение, переслушивание и
                перезапись. Экспорт WAV и MP3 одним архивом — с подсчётом минут, слов и оценкой качества звука.
              </p>
              <ul className="mt-6 space-y-3 text-cream/85">
                {[
                  [AudioLines, "Подготовка датасета для ElevenLabs Voice Clone"],
                  [Brain, "Персона для OpenAI или локальной LLM через Ollama"],
                  [Download, "Экспорт ZIP всех записей и JSON со всеми ответами"],
                ].map(([Icon, text], i) => {
                  const I = Icon as typeof Mic;
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <I className="size-5 text-honey" /> {text as string}
                    </li>
                  );
                })}
              </ul>
            </Reveal>
            <Reveal delay={0.1} className="relative mx-auto w-full max-w-sm">
              <div className="rounded-[2.5rem] bg-cream p-3 shadow-2xl">
                <div className="rounded-[2rem] bg-[#F7F4EB] p-6 text-navy">
                  <p className="text-center font-serif text-xl font-semibold">Записать воспоминание</p>
                  <div className="relative mx-auto my-8 grid size-28 place-items-center">
                    <span className="absolute inset-0 animate-pulse-ring rounded-full bg-terracotta/40" />
                    <span className="relative grid size-24 place-items-center rounded-full bg-terracotta text-white shadow-xl">
                      <Mic className="size-10" />
                    </span>
                  </div>
                  <p className="text-center font-mono text-2xl">02:17</p>
                  <p className="mt-2 text-center text-sm text-navy/60">История семьи</p>
                </div>
              </div>
              <Bird className="absolute -left-10 -top-6 w-24 animate-float" />
            </Reveal>
          </div>
        </div>
        <BrushDivider tone="blue" className="rotate-180" />
      </section>

      {/* CTA */}
      <section className="relative py-24 text-center">
        <Sparkles className="absolute left-[12%] top-10 w-16" />
        <Illustration name="hedgehog" className="absolute bottom-6 left-[6%] hidden w-36 md:block" />
        <Illustration name="daisy" className="absolute bottom-4 right-[8%] w-12 sm:w-16" />
        <Illustration name="ladybug" className="absolute right-[20%] top-8 hidden w-16 md:block" />
        <div className="container">
          <Reveal>
            <h2 className="mx-auto max-w-3xl text-4xl font-semibold sm:text-5xl">Начните с одного воспоминания</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Отвечайте в своём темпе: по вопросу в день или целой главой за вечер.
            </p>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg">
                <Link href={loggedIn ? "/app/new" : "/register"}>
                  Создать профиль <span aria-hidden>→</span>
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <Logo compact />
          <p>
            {onCloudflare
              ? "Данные хранятся в вашем аккаунте Cloudflare: база D1 и закрытое хранилище R2."
              : "Данные хранятся у вас: локальная база SQLite и файлы на вашем сервере."}
          </p>
        </div>
      </footer>
    </main>
  );
}
