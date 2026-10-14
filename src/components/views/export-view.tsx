import { AudioLines, Bot, Clapperboard, Cpu, FileArchive, FileJson, Gauge, Mic, Type } from "lucide-react";
import { Illustration } from "@/components/decor";
import { CopyButton } from "@/components/export/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { buildExportStats } from "@/lib/export";
import { ELEVENLABS_TARGETS } from "@/lib/quality";
import { formatMinutes } from "@/lib/utils";

export interface ExportIntegrations {
  voiceClone: string | null;
  llm: string | null;
}

/** local: the archive lives in this browser — files are built by the service worker, server-side features are off. */
export function ExportView({
  personId,
  stats,
  prompt,
  integrations,
  local = false,
}: {
  personId: string;
  stats: ReturnType<typeof buildExportStats>;
  prompt: string;
  integrations: ExportIntegrations;
  local?: boolean;
}) {
  const minutes = stats.seconds / 60;
  const api = `/api/persons/${personId}/export`;

  const readiness = [
    { label: "Быстрый клон голоса", target: ELEVENLABS_TARGETS.instantMinutes, hint: "по короткой записи" },
    { label: "Профессиональный клон голоса", target: ELEVENLABS_TARGETS.professionalMinutes, hint: "минимальный объём" },
    { label: "Идеальный объём записей", target: ELEVENLABS_TARGETS.idealMinutes, hint: "максимальная схожесть голоса" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="eyebrow">Подготовка данных</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Экспорт и ИИ</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
          Скачайте архив целиком или подготовьте записи, из которых можно воссоздать голос и цифровую копию личности.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
        <p className="mt-2 max-w-xl text-cream/70">
          {local
            ? "Архив собирается прямо в браузере из данных этого устройства. Скачивайте полный архив регулярно — это ваша резервная копия."
            : "Все файлы формируются на лету из базы и хранилища."}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { href: `${api}/zip?type=audio`, icon: FileArchive, title: "Все записи голоса", text: "WAV и MP3, расшифровки и описание файлов — одним ZIP-архивом", variant: "primary" as const },
            { href: `${api}/json`, icon: FileJson, title: "Данные профиля", text: "Все ответы, тесты, воспоминания и отчёт в формате JSON", variant: "secondary" as const },
            { href: `${api}/zip?type=full`, icon: FileArchive, title: "Полный архив", text: "Аудио, данные профиля, фото и описание личности для нейросети", variant: "outline" as const },
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
          <CardTitle>Хватит ли записей, чтобы воссоздать голос</CardTitle>
          <CardDescription>
            Ориентиры по объёму чистой речи для сервисов клонирования голоса. Частота дискретизации записей: {stats.sampleRates.length ? stats.sampleRates.map((r) => `${r / 1000} кГц`).join(", ") : "—"}
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

      {!local && (
        <Card>
          <CardHeader>
            <CardTitle>Интеграции</CardTitle>
            <CardDescription>Внешние сервисы, которые подключает администратор сайта</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: AudioLines, name: "Клонирование голоса", on: !!integrations.voiceClone, hint: "ElevenLabs" },
              { icon: Bot, name: "Нейросеть и расшифровка речи", on: integrations.llm === "openai", hint: "OpenAI" },
              { icon: Cpu, name: "Локальная нейросеть", on: integrations.llm === "ollama", hint: "Ollama" },
              { icon: Clapperboard, name: "Анимированный аватар", on: false, hint: "в разработке" },
            ].map((i) => (
              <div key={i.name} className="flex items-center gap-3 rounded-2xl border p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-mist text-forest">
                  <i.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{i.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{i.hint}</p>
                </div>
                <Badge color={i.on ? "grass" : "navy"}>{i.on ? "подключено" : "не настроено"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Описание личности для нейросети</CardTitle>
            <CardDescription>Собирается из ответов, воспоминаний и расшифровок. Подходит для любой нейросети-собеседника.</CardDescription>
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
