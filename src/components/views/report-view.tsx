import { Quote } from "lucide-react";
import Link from "next/link";
import { Illustration, Leaf, Sparkles } from "@/components/decor";
import { BigFiveRadar, EmotionsBar, PrioritiesRadar, TemperamentPie } from "@/components/report/report-charts";
import { PrintButton } from "@/components/report/print-button";
import { TrackSection } from "@/components/questionnaire/track-section";
import { Badge, type BadgeColor } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { personBase } from "@/lib/questionnaire";
import type { PersonalityReport } from "@/lib/report";
import { TEMPERAMENT_LABELS, type Temperament } from "@/lib/tests/temperament";
import { formatMinutes } from "@/lib/utils";

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
      {text}
      <Button asChild size="sm" variant="outline" arrow>
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}

export function ReportView({ personId, report: r }: { personId: string; report: PersonalityReport }) {
  const base = personBase(personId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <TrackSection personId={personId} slug="tests" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Отчёт о личности</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{r.name}</h1>
        </div>
        <PrintButton />
      </div>

      <section className="relative overflow-hidden rounded-[2rem] bg-navy p-6 text-cream sm:p-10">
        <Sparkles className="absolute right-48 top-8 hidden w-14 lg:block" />
        <Illustration name="fox" className="absolute right-8 top-8 hidden w-40 lg:block" />
        <Leaf className="absolute -bottom-3 right-10 w-14 rotate-45 opacity-70" color="#5E8357" />
        <Quote className="size-8 text-honey" />
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Портрет личности</h2>
        <div className="relative mt-4 space-y-3 text-lg lg:pr-52 leading-relaxed text-cream/85">
          {r.summary.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            [r.stats.words.toLocaleString("ru-RU"), "слов в ответах"],
            [String(r.stats.memories), "воспоминаний"],
            [String(r.stats.recordings), "аудиозаписей"],
            [formatMinutes(r.stats.minutes * 60), "минут голоса"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-cream/[.07] p-4">
              <p className="font-serif text-3xl font-semibold text-honey">{v}</p>
              <p className="text-sm text-cream/70">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Большая пятёрка черт</CardTitle>
            <CardDescription>Открытость, добросовестность, экстраверсия, доброжелательность, чувствительность</CardDescription>
          </CardHeader>
          <CardContent>
            {r.bigFive ? (
              <>
                <BigFiveRadar data={r.bigFive} />
                <ul className="mt-2 space-y-1.5 text-sm">
                  {r.bigFive.map((t) => (
                    <li key={t.trait} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{t.title}</span>
                      <b>{t.value}</b>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Empty text="Пройдите тест «Большая пятёрка», чтобы увидеть профиль." href={`${base}/tests`} cta="К тестам" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Темперамент и тип</CardTitle>
            <CardDescription>Классический темперамент и один из 16 типов личности</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {r.temperament ? (
              <div className="grid items-center gap-6 sm:grid-cols-[160px_1fr]">
                <div className="mx-auto w-40">
                  <TemperamentPie scores={r.temperament.scores} />
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-3xl font-semibold">{r.temperament.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.temperament.description}</p>
                  <ul className="mt-4 grid max-w-xs gap-y-1.5 text-sm">
                    {(Object.keys(TEMPERAMENT_LABELS) as Temperament[]).map((t) => (
                      <li key={t} className="flex items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: TEMPERAMENT_LABELS[t].color }} />
                        <span className="text-muted-foreground">{TEMPERAMENT_LABELS[t].title}</span>
                        <b className="ml-auto">{r.temperament!.scores[t] ?? 0}%</b>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Empty text="Темперамент ещё не определён." href={`${base}/tests`} cta="Пройти тест" />
            )}
            {r.mbti ? (
              <div className="flex items-center gap-4 rounded-2xl bg-mist/60 p-4">
                <span className="font-serif text-4xl font-semibold tracking-wider text-primary">{r.mbti.type}</span>
                <div>
                  <p className="font-semibold">{r.mbti.name}</p>
                  <p className="text-sm text-muted-foreground">{r.mbti.description}</p>
                </div>
              </div>
            ) : (
              <Empty text="Тип личности ещё не определён." href={`${base}/tests`} cta="Пройти тест" />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Карта жизненных приоритетов</CardTitle>
            <CardDescription>Что важно в жизни по шкале от 0 до 10</CardDescription>
          </CardHeader>
          <CardContent>
            {r.priorities.length >= 3 ? (
              <div className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
                <PrioritiesRadar data={r.priorities} />
                <div>
                  <p className="eyebrow mb-3">Основные ценности</p>
                  <ul className="space-y-2">
                    {r.values.map((v) => (
                      <li key={v} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Empty text="Оцените хотя бы три приоритета, чтобы построить карту." href={`${base}/m/priorities`} cta="Карта приоритетов" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Стиль общения</CardTitle>
            <CardDescription>Как человек говорит, спорит и проявляет заботу</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {r.communicationScales.map((s) => (
              <div key={s.label}>
                <p className="mb-2 text-sm font-semibold">{s.label}</p>
                <div className="relative h-2 rounded-full bg-gradient-to-r from-mist via-gold/40 to-primary/60">
                  <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-card bg-primary shadow" style={{ left: `${s.value * 10}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{s.left}</span>
                  <span>{s.right}</span>
                </div>
              </div>
            ))}
            {r.communication.length > 0 ? (
              <dl className="space-y-3">
                {r.communication.map((c) => (
                  <div key={c.label}>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</dt>
                    <dd className="mt-0.5">{c.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              r.communicationScales.length === 0 && <Empty text="Заполните раздел «Стиль общения»." href={`${base}/m/communication`} cta="Заполнить" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Эмоциональная палитра</CardTitle>
            <CardDescription>Эмоции и темы воспоминаний</CardDescription>
          </CardHeader>
          <CardContent>
            {r.emotions.length > 0 ? <EmotionsBar data={r.emotions} /> : <p className="text-sm text-muted-foreground">Отмечайте эмоции у воспоминаний.</p>}
            {r.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-baseline gap-2">
                {r.tags.map((t) => (
                  <Badge key={t.name} color={t.color as BadgeColor} style={{ fontSize: `${Math.min(1.1, 0.75 + t.count * 0.1)}rem` }}>
                    #{t.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
