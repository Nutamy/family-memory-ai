"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/client";
import { BIG_FIVE_ITEMS, BIG_FIVE_LABELS, BIG_FIVE_SCALE, type BigFiveResult, type BigFiveTrait } from "@/lib/tests/bigfive";
import { AXIS_LABELS, MBTI_ITEMS, MBTI_TYPES, type Axis, type MbtiResult } from "@/lib/tests/mbti";
import { TEMPERAMENT_ITEMS, TEMPERAMENT_LABELS, type Temperament, type TemperamentResult } from "@/lib/tests/temperament";
import { TEST_META, type TestKind } from "@/lib/tests";
import { cn } from "@/lib/utils";

export interface TestState {
  answers: Record<string, unknown>;
  completed: boolean;
  result: unknown;
}

interface Item {
  id: string;
  text: string;
  options: { label: string; value: unknown }[];
}

const ITEMS: Record<TestKind, Item[]> = {
  bigfive: BIG_FIVE_ITEMS.map((i) => ({ id: i.id, text: i.text, options: BIG_FIVE_SCALE.map((label, k) => ({ label, value: k + 1 })) })),
  mbti: MBTI_ITEMS.map((i) => ({ id: i.id, text: i.text, options: [{ label: i.a, value: "a" }, { label: i.b, value: "b" }] })),
  temperament: TEMPERAMENT_ITEMS.map((i) => ({ id: i.id, text: i.text, options: i.options.map((o) => ({ label: o.label, value: o.type })) })),
};

export function TestsPanel({ personId, initial }: { personId: string; initial: Record<TestKind, TestState> }) {
  return (
    <Tabs defaultValue="bigfive">
      <TabsList>
        {(Object.keys(TEST_META) as TestKind[]).map((k) => (
          <TabsTrigger key={k} value={k}>
            {initial[k].completed && <Check className="size-4 text-grass" />} {TEST_META[k].title}
          </TabsTrigger>
        ))}
      </TabsList>
      {(Object.keys(TEST_META) as TestKind[]).map((k) => (
        <TabsContent key={k} value={k} className="mt-6 focus-visible:outline-none">
          <TestRunner personId={personId} kind={k} initial={initial[k]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function TestRunner({ personId, kind, initial }: { personId: string; kind: TestKind; initial: TestState }) {
  const router = useRouter();
  const items = ITEMS[kind];
  const [answers, setAnswers] = useState<Record<string, unknown>>(initial.answers);
  const [result, setResult] = useState<unknown>(initial.completed ? initial.result : null);
  const firstOpen = items.findIndex((i) => answers[i.id] === undefined);
  const [step, setStep] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [dir, setDir] = useState(1);

  async function persist(next: Record<string, unknown>) {
    const res = await api<{ completed: boolean; result: unknown }>(`/api/persons/${personId}/tests/${kind}`, { method: "PUT", json: { answers: next } });
    if (res.completed) {
      setResult(res.result);
      router.refresh();
    }
  }

  function choose(value: unknown) {
    const item = items[step];
    const next = { ...answers, [item.id]: value };
    setAnswers(next);
    void persist(next);
    const nextOpen = items.findIndex((i, idx) => idx > step && next[i.id] === undefined);
    const target = nextOpen !== -1 ? nextOpen : items.findIndex((i) => next[i.id] === undefined);
    if (target !== -1) {
      setDir(1);
      setTimeout(() => setStep(target), 180);
    }
  }

  async function restart() {
    if (!confirm("Пройти тест заново? Текущий результат будет удалён.")) return;
    await api(`/api/persons/${personId}/tests/${kind}`, { method: "DELETE" });
    setAnswers({});
    setResult(null);
    setStep(0);
    router.refresh();
  }

  const answered = items.filter((i) => answers[i.id] !== undefined).length;

  if (result) {
    return (
      <div className="space-y-4">
        <div className="paper-card p-6 sm:p-8">
          {kind === "bigfive" && <BigFiveView result={result as BigFiveResult} />}
          {kind === "mbti" && <MbtiView result={result as MbtiResult} />}
          {kind === "temperament" && <TemperamentView result={result as TemperamentResult} />}
        </div>
        <Button variant="outline" size="sm" onClick={restart}>
          <RotateCcw /> Пройти заново
        </Button>
      </div>
    );
  }

  const item = items[step];
  return (
    <div className="paper-card overflow-hidden p-6 sm:p-10">
      <div className="mb-8 flex items-center gap-3">
        <Progress value={(answered / items.length) * 100} />
        <span className="shrink-0 text-sm font-bold text-muted-foreground">
          {answered} / {items.length}
        </span>
      </div>
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={item.id}
          custom={dir}
          initial={{ opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -40 }}
          transition={{ duration: 0.22 }}
        >
          <p className="eyebrow">Вопрос {step + 1}</p>
          <h3 className="mt-2 min-h-[4rem] text-2xl font-semibold sm:text-3xl">{item.text}</h3>
          <div className={cn("mt-6 grid gap-2.5", kind === "bigfive" ? "sm:grid-cols-5" : "sm:grid-cols-2")}>
            {item.options.map((o) => {
              const selected = answers[item.id] === o.value;
              return (
                <button
                  key={String(o.value)}
                  type="button"
                  onClick={() => choose(o.value)}
                  className={cn(
                    "focus-ring rounded-2xl border px-4 py-4 text-left text-[15px] font-semibold transition-all hover:-translate-y-0.5",
                    kind === "bigfive" && "text-center text-sm",
                    selected ? "border-primary bg-primary text-white shadow-lg" : "bg-background/60 hover:border-primary/40",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-8 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={step === 0}
          onClick={() => {
            setDir(-1);
            setStep((s) => Math.max(0, s - 1));
          }}
        >
          <ArrowLeft /> Назад
        </Button>
        <p className="self-center text-xs text-muted-foreground">Ответы сохраняются сразу</p>
      </div>
    </div>
  );
}

function Bar({ value, color = "bg-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-foreground/10">
      <motion.div className={cn("h-full rounded-full", color)} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} />
    </div>
  );
}

export function BigFiveView({ result }: { result: BigFiveResult }) {
  const colors = ["bg-primary", "bg-gold", "bg-grass", "bg-forest", "bg-navy dark:bg-cream/70"];
  return (
    <div>
      <h3 className="text-2xl font-semibold">Профиль «Большой пятёрки»</h3>
      <div className="mt-6 space-y-5">
        {(Object.keys(BIG_FIVE_LABELS) as BigFiveTrait[]).map((t, i) => {
          const l = BIG_FIVE_LABELS[t];
          const v = result[t];
          return (
            <div key={t}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {l.title}
                </p>
                <span className="font-serif text-xl font-semibold">{v}</span>
              </div>
              <Bar value={v} color={colors[i]} />
              <p className="mt-1 text-sm text-muted-foreground">{v >= 60 ? l.high : v <= 40 ? l.low : "Сбалансированный уровень"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MbtiView({ result }: { result: MbtiResult }) {
  const info = MBTI_TYPES[result.type];
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="font-serif text-6xl font-semibold tracking-wider text-primary">{result.type}</span>
        <div>
          <h3 className="text-2xl font-semibold">{info?.name}</h3>
          <p className="text-muted-foreground">{info?.description}</p>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        {(Object.keys(AXIS_LABELS) as Axis[]).map((a) => (
          <div key={a}>
            <div className="mb-1 flex justify-between text-sm font-semibold">
              <span>
                {AXIS_LABELS[a][0]} {result.axes[a].first}%
              </span>
              <span>
                {result.axes[a].second}% {AXIS_LABELS[a][1]}
              </span>
            </div>
            <Bar value={result.axes[a].first} color="bg-gold" />
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Ориентировочная типология по мотивам методики Майерс — Бриггс, не является официальным тестом®.</p>
    </div>
  );
}

export function TemperamentView({ result }: { result: TemperamentResult }) {
  const d = TEMPERAMENT_LABELS[result.dominant];
  return (
    <div>
      <p className="eyebrow">Ведущий темперамент</p>
      <h3 className="mt-1 text-4xl font-semibold" style={{ color: d.color === "#1D314F" ? undefined : d.color }}>
        {d.title}
      </h3>
      <p className="mt-2 text-muted-foreground">{d.description}</p>
      <div className="mt-6 space-y-4">
        {(Object.keys(TEMPERAMENT_LABELS) as Temperament[]).map((t) => (
          <div key={t}>
            <div className="mb-1 flex justify-between text-sm font-semibold">
              <span>{TEMPERAMENT_LABELS[t].title}</span>
              <span>{result.scores[t]}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-foreground/10">
              <motion.div
                className="h-full rounded-full"
                style={{ background: TEMPERAMENT_LABELS[t].color }}
                initial={{ width: 0 }}
                animate={{ width: `${result.scores[t]}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
