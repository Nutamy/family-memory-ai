// Rule-based personality report. Deterministic and offline; an LLM provider
// (see src/lib/integrations) can later rewrite `summary` into richer prose.
import type { PersonBundle } from "./data";
import { getModule, getQuestion } from "./questionnaire";
import { BIG_FIVE_LABELS, type BigFiveResult, type BigFiveTrait } from "./tests/bigfive";
import { MBTI_TYPES, type MbtiResult } from "./tests/mbti";
import { TEMPERAMENT_LABELS, type TemperamentResult } from "./tests/temperament";
import { ageFromBirthDate, parseJson, plural, wordCount } from "./utils";

export interface PersonalityReport {
  name: string;
  age: number | null;
  summary: string[];
  bigFive: { trait: BigFiveTrait; title: string; en: string; value: number; note: string }[] | null;
  mbti: (MbtiResult & { name: string; description: string }) | null;
  temperament: (TemperamentResult & { title: string; description: string }) | null;
  priorities: { label: string; value: number }[];
  values: string[];
  communication: { label: string; value: string }[];
  communicationScales: { label: string; left: string; right: string; value: number }[];
  emotions: { name: string; count: number }[];
  tags: { name: string; count: number; color: string }[];
  stats: { words: number; memories: number; recordings: number; minutes: number };
}

function answerMap(bundle: PersonBundle) {
  return new Map(bundle.answers.map((a) => [a.questionId, a]));
}

export function buildReport(bundle: PersonBundle): PersonalityReport {
  const answers = answerMap(bundle);
  const text = (id: string) => answers.get(id)?.text.trim() ?? "";
  const value = <T,>(id: string, fallback: T) => parseJson<T>(answers.get(id)?.value, fallback);

  const tests = Object.fromEntries(bundle.testResults.filter((t) => t.completed).map((t) => [t.kind, parseJson(t.result, null)]));
  const bf = tests.bigfive as BigFiveResult | null | undefined;
  const mb = tests.mbti as MbtiResult | null | undefined;
  const tp = tests.temperament as TemperamentResult | null | undefined;

  const bigFive = bf
    ? (Object.keys(BIG_FIVE_LABELS) as BigFiveTrait[]).map((trait) => {
        const l = BIG_FIVE_LABELS[trait];
        const v = bf[trait] ?? 50;
        return { trait, title: l.title, en: l.en, value: v, note: v >= 60 ? l.high : v <= 40 ? l.low : "сбалансированно" };
      })
    : null;

  const mbti = mb ? { ...mb, ...(MBTI_TYPES[mb.type] ?? { name: mb.type, description: "" }) } : null;
  const temperament = tp ? { ...tp, ...TEMPERAMENT_LABELS[tp.dominant] } : null;

  const priorities = (getModule("priorities")?.questions ?? [])
    .map((q) => ({ label: q.text, value: Number(value<number | null>(q.id, null) ?? 0) }))
    .filter((p) => p.value > 0);
  const topPriorities = [...priorities].sort((a, b) => b.value - a.value).slice(0, 3);

  const values: string[] = [];
  for (const p of topPriorities) values.push(p.label);
  const fc = value<string | null>("values.family_career", null);
  if (fc) values.push(`Семья или карьера: ${fc.toLowerCase()}`);
  const lie = value<string | null>("values.white_lie", null);
  if (lie) values.push(`Ложь во благо: ${lie.toLowerCase()}`);
  const rule = text("family.main_rule");
  if (rule) values.push(`Правило семьи: «${rule}»`);

  const communication: { label: string; value: string }[] = [];
  const conflict = value<string | null>("communication.conflict", null);
  if (conflict) communication.push({ label: "В споре", value: conflict });
  const loveLang = value<string[]>("communication.love_language", []);
  if (loveLang.length) communication.push({ label: "Забота", value: loveLang.join(", ") });
  const emo = value<string | null>("habits.emotion_express", null);
  if (emo) communication.push({ label: "Эмоции", value: emo });
  const address = text("communication.address");
  if (address) communication.push({ label: "Обращения", value: address });
  const catch_ = text("communication.catchphrases");
  if (catch_) communication.push({ label: "Любимые фразы", value: catch_ });

  const communicationScales = ["communication.directness", "communication.humor", "communication.listener"]
    .map((id) => {
      const q = getQuestion(id);
      const v = value<number | null>(id, null);
      return q && v != null
        ? { label: q.text, left: q.slider!.minLabel, right: q.slider!.maxLabel, value: Number(v) }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const emotionCounts = new Map<string, number>();
  const tagCounts = new Map<string, { count: number; color: string }>();
  for (const m of bundle.memories) {
    if (m.emotion) emotionCounts.set(m.emotion, (emotionCounts.get(m.emotion) ?? 0) + 1);
    for (const t of m.tags) {
      const prev = tagCounts.get(t.name);
      tagCounts.set(t.name, { count: (prev?.count ?? 0) + 1, color: t.color });
    }
  }

  const words =
    bundle.answers.reduce((s, a) => s + wordCount(a.text), 0) +
    bundle.memories.reduce((s, m) => s + wordCount(m.content), 0) +
    bundle.voiceRecords.reduce((s, v) => s + wordCount(v.transcription), 0);
  const seconds = bundle.voiceRecords.reduce((s, v) => s + v.duration, 0);

  const name = [bundle.firstName, bundle.middleName, bundle.lastName].filter(Boolean).join(" ");
  const age = ageFromBirthDate(bundle.birthDate);

  // Summary paragraphs.
  const summary: string[] = [];
  const intro: string[] = [name || "Этот человек"];
  if (age) intro.push(`${age} ${plural(age, ["год", "года", "лет"])}`);
  if (bundle.profession) intro.push(bundle.profession.toLowerCase());
  if (bundle.residence) intro.push(`живёт: ${bundle.residence}`);
  summary.push(intro.join(", ") + ".");
  if (bundle.bio) summary.push(bundle.bio);

  if (temperament || mbti) {
    const parts: string[] = [];
    if (temperament) parts.push(`По темпераменту — ${temperament.title.toLowerCase()}: ${temperament.description.toLowerCase()}`);
    if (mbti) parts.push(`Тип ${mbti.type} («${mbti.name}») — ${mbti.description.toLowerCase()}`);
    summary.push(parts.join(" "));
  }
  if (bigFive) {
    const strong = bigFive.filter((t) => t.value >= 60).map((t) => t.note);
    const low = bigFive.filter((t) => t.value <= 40).map((t) => t.note);
    const traits = [...strong, ...low];
    if (traits.length) summary.push(`Характер: ${traits.join("; ")}.`);
  }
  if (topPriorities.length) {
    summary.push(`Главные жизненные приоритеты — ${topPriorities.map((p) => p.label.toLowerCase()).join(", ")}.`);
  }
  const proud = text("basic.proud");
  if (proud) summary.push(`О главной гордости: «${proud.split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, "")}».`);

  return {
    name,
    age,
    summary,
    bigFive,
    mbti,
    temperament,
    priorities,
    values,
    communication,
    communicationScales,
    emotions: [...emotionCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    tags: [...tagCounts].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.count - a.count),
    stats: { words, memories: bundle.memories.length, recordings: bundle.voiceRecords.length, minutes: seconds / 60 },
  };
}
