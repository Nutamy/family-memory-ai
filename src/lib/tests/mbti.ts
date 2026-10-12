// Simplified MBTI-style typology: 20 forced-choice items, 5 per dichotomy.
// This is an orientation tool, not the official MBTI® instrument.

export type Axis = "EI" | "SN" | "TF" | "JP";

export interface MbtiItem {
  id: string;
  axis: Axis;
  text: string;
  a: string; // first pole (E, S, T, J)
  b: string; // second pole (I, N, F, P)
}

export const MBTI_ITEMS: MbtiItem[] = [
  { id: "m1", axis: "EI", text: "После тяжёлой недели вы восстанавливаетесь…", a: "в компании друзей", b: "в тишине, наедине с собой" },
  { id: "m2", axis: "SN", text: "Вы больше доверяете…", a: "фактам и опыту", b: "интуиции и предчувствию" },
  { id: "m3", axis: "TF", text: "Принимая решение, вы опираетесь на…", a: "логику и справедливость", b: "чувства людей и гармонию" },
  { id: "m4", axis: "JP", text: "Вы предпочитаете…", a: "заранее всё планировать", b: "действовать по обстоятельствам" },
  { id: "m5", axis: "EI", text: "Среди незнакомых людей вы…", a: "легко заводите разговор", b: "ждёте, пока заговорят с вами" },
  { id: "m6", axis: "SN", text: "Вас больше интересует…", a: "то, что есть сейчас", b: "то, что могло бы быть" },
  { id: "m7", axis: "TF", text: "В споре для вас важнее…", a: "найти истину", b: "сохранить отношения" },
  { id: "m8", axis: "JP", text: "Перед поездкой вы…", a: "собираете вещи заранее по списку", b: "собираетесь в последний момент" },
  { id: "m9", axis: "EI", text: "Вам легче думать…", a: "вслух, обсуждая с другими", b: "про себя, а потом говорить" },
  { id: "m10", axis: "SN", text: "Объясняя дорогу, вы…", a: "называете конкретные ориентиры", b: "описываете общее направление" },
  { id: "m11", axis: "TF", text: "Ваша критика обычно…", a: "прямая и по делу", b: "мягкая и бережная" },
  { id: "m12", axis: "JP", text: "Незавершённые дела вас…", a: "тревожат", b: "не особо беспокоят" },
  { id: "m13", axis: "EI", text: "Ваш круг общения…", a: "широкий, много знакомых", b: "узкий, несколько близких людей" },
  { id: "m14", axis: "SN", text: "Вам ближе…", a: "проверенные способы", b: "новые идеи и эксперименты" },
  { id: "m15", axis: "TF", text: "Скорее вас назовут…", a: "рассудительным человеком", b: "сердечным человеком" },
  { id: "m16", axis: "JP", text: "Сроки для вас — это…", a: "обязательство", b: "ориентир" },
  { id: "m17", axis: "EI", text: "Звонок от старого знакомого…", a: "радует, с удовольствием поболтаю", b: "иногда хочется отложить" },
  { id: "m18", axis: "SN", text: "В книгах вы цените…", a: "детали и реалистичность", b: "смыслы и символы" },
  { id: "m19", axis: "TF", text: "Друг делится проблемой — вы…", a: "предлагаете решение", b: "сначала сочувствуете и слушаете" },
  { id: "m20", axis: "JP", text: "Ваш рабочий стол…", a: "в порядке", b: "в творческом беспорядке" },
];

const POLES: Record<Axis, [string, string]> = { EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] };

export const AXIS_LABELS: Record<Axis, [string, string]> = {
  EI: ["Экстраверсия", "Интроверсия"],
  SN: ["Ощущение", "Интуиция"],
  TF: ["Мышление", "Чувство"],
  JP: ["Суждение", "Восприятие"],
};

export const MBTI_TYPES: Record<string, { name: string; description: string }> = {
  ISTJ: { name: "Хранитель порядка", description: "Надёжный, ответственный, верен слову и традициям." },
  ISFJ: { name: "Защитник", description: "Заботливый и преданный, помнит мелочи о близких." },
  INFJ: { name: "Наставник", description: "Глубокий, чуткий, ищет смысл и помогает расти другим." },
  INTJ: { name: "Стратег", description: "Независимый мыслитель, видит далеко вперёд." },
  ISTP: { name: "Мастер", description: "Спокойный практик, умеет починить что угодно." },
  ISFP: { name: "Художник", description: "Мягкий, чувствующий красоту, живёт сердцем." },
  INFP: { name: "Мечтатель", description: "Идеалист с богатым внутренним миром и сильными ценностями." },
  INTP: { name: "Мыслитель", description: "Любознательный аналитик, любит идеи и теории." },
  ESTP: { name: "Деятель", description: "Энергичный, смелый, решает задачи здесь и сейчас." },
  ESFP: { name: "Душа компании", description: "Жизнерадостный, щедрый на эмоции и праздники." },
  ENFP: { name: "Вдохновитель", description: "Полон идей и энтузиазма, зажигает других." },
  ENTP: { name: "Изобретатель", description: "Остроумный спорщик, любит новые возможности." },
  ESTJ: { name: "Организатор", description: "Деловой, решительный, наводит порядок вокруг." },
  ESFJ: { name: "Хозяин дома", description: "Гостеприимный, объединяет семью и друзей." },
  ENFJ: { name: "Лидер сердец", description: "Харизматичный, ведёт людей за собой заботой." },
  ENTJ: { name: "Командир", description: "Целеустремлённый лидер, мыслит масштабно." },
};

export interface MbtiResult {
  type: string;
  axes: Record<Axis, { first: number; second: number }>;
}

/** answers: itemId -> "a" | "b" */
export function scoreMbti(answers: Record<string, "a" | "b">): MbtiResult {
  const counts: Record<Axis, { a: number; b: number }> = {
    EI: { a: 0, b: 0 },
    SN: { a: 0, b: 0 },
    TF: { a: 0, b: 0 },
    JP: { a: 0, b: 0 },
  };
  for (const item of MBTI_ITEMS) {
    const v = answers[item.id];
    if (v) counts[item.axis][v] += 1;
  }
  let type = "";
  const axes = {} as MbtiResult["axes"];
  for (const axis of Object.keys(POLES) as Axis[]) {
    const { a, b } = counts[axis];
    const total = a + b || 1;
    const first = Math.round((a / total) * 100);
    axes[axis] = { first, second: 100 - first };
    type += a >= b ? POLES[axis][0] : POLES[axis][1];
  }
  return { type, axes };
}
