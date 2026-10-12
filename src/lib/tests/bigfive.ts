// Big Five via the Mini-IPIP (Donnellan et al., 2006) — 20 items from the public-domain
// International Personality Item Pool, translated to Russian. Likert 1..5.

export type BigFiveTrait = "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism";

export interface BigFiveItem {
  id: string;
  text: string;
  trait: BigFiveTrait;
  reverse: boolean;
}

export const BIG_FIVE_SCALE = ["Совсем не про меня", "Скорее нет", "Нейтрально", "Скорее да", "Точно про меня"];

export const BIG_FIVE_ITEMS: BigFiveItem[] = [
  { id: "b1", text: "Я — душа компании", trait: "extraversion", reverse: false },
  { id: "b2", text: "Я сочувствую переживаниям других людей", trait: "agreeableness", reverse: false },
  { id: "b3", text: "Я делаю домашние дела сразу, не откладывая", trait: "conscientiousness", reverse: false },
  { id: "b4", text: "У меня часто меняется настроение", trait: "neuroticism", reverse: false },
  { id: "b5", text: "У меня богатое воображение", trait: "openness", reverse: false },
  { id: "b6", text: "Я немногословен(на)", trait: "extraversion", reverse: true },
  { id: "b7", text: "Меня не особенно интересуют чужие проблемы", trait: "agreeableness", reverse: true },
  { id: "b8", text: "Я часто забываю класть вещи на место", trait: "conscientiousness", reverse: true },
  { id: "b9", text: "Большую часть времени я спокоен(на) и расслаблен(а)", trait: "neuroticism", reverse: true },
  { id: "b10", text: "Меня не интересуют абстрактные идеи", trait: "openness", reverse: true },
  { id: "b11", text: "В компании я общаюсь с множеством разных людей", trait: "extraversion", reverse: false },
  { id: "b12", text: "Я чувствую эмоции других людей", trait: "agreeableness", reverse: false },
  { id: "b13", text: "Я люблю порядок", trait: "conscientiousness", reverse: false },
  { id: "b14", text: "Я легко расстраиваюсь", trait: "neuroticism", reverse: false },
  { id: "b15", text: "Мне трудно понимать абстрактные идеи", trait: "openness", reverse: true },
  { id: "b16", text: "Я предпочитаю оставаться в тени", trait: "extraversion", reverse: true },
  { id: "b17", text: "На самом деле другие люди мне не очень интересны", trait: "agreeableness", reverse: true },
  { id: "b18", text: "Я часто устраиваю беспорядок", trait: "conscientiousness", reverse: true },
  { id: "b19", text: "Мне редко бывает грустно", trait: "neuroticism", reverse: true },
  { id: "b20", text: "У меня не очень хорошее воображение", trait: "openness", reverse: true },
];

export const BIG_FIVE_LABELS: Record<BigFiveTrait, { title: string; en: string; high: string; low: string }> = {
  openness: {
    title: "Открытость опыту",
    en: "Openness",
    high: "любознателен, ценит новое, искусство и идеи",
    low: "предпочитает проверенное, практичен и конкретен",
  },
  conscientiousness: {
    title: "Добросовестность",
    en: "Conscientiousness",
    high: "организован, надёжен, доводит дела до конца",
    low: "гибок и спонтанен, легко относится к планам",
  },
  extraversion: {
    title: "Экстраверсия",
    en: "Extraversion",
    high: "общителен, энергичен, заряжается от людей",
    low: "сдержан, ценит тишину и глубокие беседы",
  },
  agreeableness: {
    title: "Доброжелательность",
    en: "Agreeableness",
    high: "тёплый, сочувствующий, готов помочь",
    low: "независим в суждениях, прям и требователен",
  },
  neuroticism: {
    title: "Эмоциональная чувствительность",
    en: "Neuroticism",
    high: "глубоко переживает, остро чувствует тревогу и обиду",
    low: "эмоционально устойчив, спокоен под давлением",
  },
};

export type BigFiveResult = Record<BigFiveTrait, number>;

/** Returns 0..100 per trait. Unanswered items are ignored. */
export function scoreBigFive(answers: Record<string, number>): BigFiveResult {
  const sums: Record<string, { s: number; n: number }> = {};
  for (const item of BIG_FIVE_ITEMS) {
    const raw = answers[item.id];
    if (!raw) continue;
    const v = item.reverse ? 6 - raw : raw;
    sums[item.trait] ??= { s: 0, n: 0 };
    sums[item.trait].s += v;
    sums[item.trait].n += 1;
  }
  const out = {} as BigFiveResult;
  for (const t of Object.keys(BIG_FIVE_LABELS) as BigFiveTrait[]) {
    const x = sums[t];
    out[t] = x ? Math.round(((x.s / x.n - 1) / 4) * 100) : 50;
  }
  return out;
}
