import { AudioLines, Bot, Clapperboard, Cpu, FileArchive, FileJson, Gauge, Mic, Type } from "lucide-react";
import { Illustration } from "@/components/decor";
import { CopyButton } from "@/components/export/copy-button";
import { TelegramSend } from "@/components/export/telegram-send";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requirePerson } from "@/lib/auth";
import { loadPersonBundle } from "@/lib/data";
import { db } from "@/lib/db";
import { buildExportStats } from "@/lib/export";
import { integrationStatus } from "@/lib/integrations";
import { buildPersonaPrompt } from "@/lib/integrations/persona";
import { ELEVENLABS_TARGETS } from "@/lib/quality";
import { buildReport } from "@/lib/report";
import { formatMinutes } from "@/lib/utils";

export const metadata = { title: "Экспорт и ИИ" };

export default async function ExportPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const { user } = await requirePerson(personId);
  const { telegramChatId } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { telegramChatId: true } });
  const bundle = await loadPersonBundle(personId);
  const stats = buildExportStats(bundle);
  const integrations = integrationStatus();
  const prompt = buildPersonaPrompt(bundle, buildReport(bundle));
  const minutes = stats.seconds / 60;
  const api = `/api/persons/${personId}/export`;

  const readiness = [
    { label: "Instant Voice Clone", target: ELEVENLABS_TARGETS.instantMinutes, hint: "быстрый клон по короткой записи" },
    { label: "Professional Voice Clone", target: ELEVENLABS_TARGETS.professionalMinutes, hint: "минимум для профессионального клона" },
    { label: "Идеальный датасет", target: ELEVENLABS_TARGETS.idealMinutes, hint: "максимальная схожесть голоса" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="eyebrow">Подготовка данных</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Экспорт и ИИ</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
          Скачайте архив целиком или подготовьте датасет для голосового клона ElevenLabs и цифровой персоны.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Mic, value: formatMinutes(stats.seconds), label: "минут записи" },
          { icon: AudioLines, value: String(stats.recordings), label: "аудиофайлов" },
          { icon: Type, value: stats.words.toLocaleString("ru-RU"), label: "слов в ответах" },
          { icon: Gauge, value: stats.quality?.label ?? "—", label: stats.quality ? `качество звука · ${stats.quality.score}/100` : "качество звука" },
        ].map((s) => (
          <div key={s.label} className="paper-card p-5">
            <s.icon className="size-5 text-primary" />
            <p className="mt-3 font-serif text-3xl font-semibold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-[2rem] bg-navy p-6 text-cream sm:p-10">
        <Illustration name="squirrel" className="absolute right-6 top-4 hidden w-28 sm:block" />
        <h2 className="text-3xl font-semibold">Скачать архив</h2>
        <p className="mt-2 max-w-xl text-cream/70">Все файлы формируются на лету из вашей локальной базы и хранилища.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { href: `${api}/zip?type=audio`, icon: FileArchive, title: "ZIP всех записей", text: "WAV + MP3, расшифровки и metadata.json", variant: "primary" as const },
            { href: `${api}/json`, icon: FileJson, title: "JSON профиля", text: "Все ответы, тесты, воспоминания, отчёт", variant: "secondary" as const },
            { href: `${api}/zip?type=full`, icon: FileArchive, title: "Полный архив", text: "Аудио, profile.json, фото и промпт персоны", variant: "outline" as const },
          ].map((d) => (
            <div key={d.title} className="flex flex-col rounded-3xl bg-cream/[.07] p-5">
              <d.icon className="size-7 text-honey" />
              <p className="mt-3 font-serif text-xl font-semibold">{d.title}</p>
              <p className="mb-5 mt-1 flex-1 text-sm text-cream/70">{d.text}</p>
              <Button asChild variant={d.variant} className={d.variant === "outline" ? "border-cream/30 bg-transparent text-cream hover:text-honey" : ""}>
                <a href={d.href} download>
                  Скачать <span aria-hidden>→</span>
                </a>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Отправить в Telegram</CardTitle>
          <CardDescription>Результаты придут вам в Telegram от нашего бота. Каждая запись приходит отдельным файлом; записи больше 50 МБ (лимит ботов) — кусками.</CardDescription>
        </CardHeader>
        <CardContent>
          <TelegramSend personId={personId} configured={integrations.telegram} connected={!!telegramChatId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Готовность к ElevenLabs Voice Clone</CardTitle>
          <CardDescription>
            Ориентиры по объёму чистой речи. Частота дискретизации записей: {stats.sampleRates.length ? stats.sampleRates.map((r) => `${r / 1000} кГц`).join(", ") : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {readiness.map((r) => {
            const pct = Math.min(100, (minutes / r.target) * 100);
            return (
              <div key={r.label}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">
                    {r.label} <span className="text-sm font-normal text-muted-foreground">· {r.hint}</span>
                  </p>
                  <span className="text-sm font-bold">
                    {formatMinutes(stats.seconds)} / {r.target} мин {pct >= 100 && <Badge color="grass">готово</Badge>}
                  </span>
                </div>
                <Progress value={pct} barClassName={pct >= 100 ? "from-grass to-forest" : undefined} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Интеграции</CardTitle>
          <CardDescription>Подключаются ключами в .env — архитектура уже готова (src/lib/integrations)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: AudioLines, name: "ElevenLabs Voice Clone", on: !!integrations.voiceClone, env: "ELEVENLABS_API_KEY" },
            { icon: Bot, name: "OpenAI (персона и Whisper)", on: integrations.llm === "openai", env: "OPENAI_API_KEY" },
            { icon: Cpu, name: "Локальная LLM через Ollama", on: integrations.llm === "ollama", env: "OLLAMA_BASE_URL" },
            { icon: Clapperboard, name: "Анимированный аватар", on: false, env: "AVATAR_PROVIDER" },
          ].map((i) => (
            <div key={i.name} className="flex items-center gap-3 rounded-2xl border p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-mist text-forest">
                <i.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{i.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{i.env}</p>
              </div>
              <Badge color={i.on ? "grass" : "navy"}>{i.on ? "подключено" : "не настроено"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Системный промпт цифровой персоны</CardTitle>
            <CardDescription>Собирается из ответов, воспоминаний и расшифровок. Подходит для любой LLM.</CardDescription>
          </div>
          <CopyButton text={prompt} />
        </CardHeader>
        <CardContent>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-background/70 p-4 font-sans text-sm leading-relaxed">{prompt}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
