// Temperament questionnaire: each answer option votes for one of the four classical types.

export type Temperament = "sanguine" | "choleric" | "phlegmatic" | "melancholic";

export interface TemperamentItem {
  id: string;
  text: string;
  options: { label: string; type: Temperament }[];
}

const raw: [string, string, string, string, string][] = [
  // question, sanguine, choleric, phlegmatic, melancholic
  ["В новой компании вы…", "быстро становитесь своим", "берёте инициативу на себя", "спокойно присматриваетесь", "чувствуете себя неуютно"],
  ["Когда что-то идёт не по плану…", "быстро нахожу другой вариант", "раздражаюсь и действую напором", "сохраняю спокойствие", "долго переживаю"],
  ["Ваша речь…", "живая, с жестами", "быстрая и эмоциональная", "размеренная, неторопливая", "тихая и негромкая"],
  ["Монотонная работа…", "быстро надоедает", "раздражает", "даётся легко", "успокаивает, если без спешки"],
  ["Обиды вы…", "быстро забываю", "вспыхиваю, но быстро отхожу", "редко обижаюсь", "помню долго"],
  ["Ваш идеальный выходной…", "встречи, события, новые места", "спорт и активные дела", "дома, в привычном ритме", "книга или прогулка в одиночестве"],
  ["Перед важным событием…", "волнуюсь, но с интересом", "рвусь в бой", "почти не волнуюсь", "сильно тревожусь"],
  ["Решения вы принимаете…", "быстро, но легко меняете", "быстро и твёрдо", "медленно, но надёжно", "долго сомневаетесь"],
  ["Под давлением вы…", "находите выход с юмором", "становитесь резким", "остаётесь невозмутимы", "теряетесь"],
  ["Ваши эмоции…", "яркие, но быстро проходят", "сильные и бурные", "ровные, малозаметные", "глубокие и затаённые"],
  ["За новое дело вы…", "загораетесь, но можете остыть", "беретесь с напором", "беретесь не спеша и доводите до конца", "беретесь с опаской"],
  ["Друзья ценят вас за…", "лёгкость и оптимизм", "энергию и решительность", "надёжность и спокойствие", "чуткость и глубину"],
];

const ORDER: Temperament[] = ["sanguine", "choleric", "phlegmatic", "melancholic"];

// Rotate option order per item so the same type is not always in the same position.
export const TEMPERAMENT_ITEMS: TemperamentItem[] = raw.map(([text, ...labels], i) => {
  const opts = labels.map((label, j) => ({ label, type: ORDER[j] }));
  const shift = i % 4;
  return { id: `t${i + 1}`, text, options: [...opts.slice(shift), ...opts.slice(0, shift)] };
});

export const TEMPERAMENT_LABELS: Record<Temperament, { title: string; description: string; color: string }> = {
  sanguine: {
    title: "Сангвиник",
    description: "Живой, общительный, легко адаптируется и быстро восстанавливается после неудач.",
    color: "#E2A34A",
  },
  choleric: {
    title: "Холерик",
    description: "Энергичный и решительный лидер, вспыльчив, но отходчив.",
    color: "#C15C46",
  },
  phlegmatic: {
    title: "Флегматик",
    description: "Спокойный, устойчивый и надёжный, действует обдуманно.",
    color: "#5E8357",
  },
  melancholic: {
    title: "Меланхолик",
    description: "Чуткий и глубокий, тонко чувствует людей и красоту мира.",
    color: "#1D314F",
  },
};

export interface TemperamentResult {
  dominant: Temperament;
  scores: Record<Temperament, number>;
}

/** answers: itemId -> temperament type chosen */
export function scoreTemperament(answers: Record<string, Temperament>): TemperamentResult {
  const counts: Record<Temperament, number> = { sanguine: 0, choleric: 0, phlegmatic: 0, melancholic: 0 };
  let n = 0;
  for (const item of TEMPERAMENT_ITEMS) {
    const t = answers[item.id];
    if (t && t in counts) {
      counts[t] += 1;
      n += 1;
    }
  }
  const scores = { ...counts };
  for (const t of ORDER) scores[t] = n ? Math.round((counts[t] / n) * 100) : 0;
  const dominant = ORDER.reduce((best, t) => (counts[t] > counts[best] ? t : best), ORDER[0]);
  return { dominant, scores };
}
