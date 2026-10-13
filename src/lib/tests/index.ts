import { BIG_FIVE_ITEMS, scoreBigFive } from "./bigfive";
import { MBTI_ITEMS, scoreMbti } from "./mbti";
import { TEMPERAMENT_ITEMS, scoreTemperament, type Temperament } from "./temperament";

export type TestKind = "bigfive" | "mbti" | "temperament";

export const TEST_KINDS: TestKind[] = ["bigfive", "mbti", "temperament"];

export const TEST_META: Record<TestKind, { title: string; subtitle: string; total: number }> = {
  bigfive: { title: "Большая пятёрка", subtitle: "Пять фундаментальных черт личности", total: BIG_FIVE_ITEMS.length },
  mbti: { title: "Тип личности", subtitle: "16 типов по четырём шкалам", total: MBTI_ITEMS.length },
  temperament: { title: "Темперамент", subtitle: "Сангвиник, холерик, флегматик или меланхолик", total: TEMPERAMENT_ITEMS.length },
};

/** Server-side scoring so stored results never depend on client math. */
export function scoreTest(kind: TestKind, answers: Record<string, unknown>) {
  switch (kind) {
    case "bigfive":
      return scoreBigFive(answers as Record<string, number>);
    case "mbti":
      return scoreMbti(answers as Record<string, "a" | "b">);
    case "temperament":
      return scoreTemperament(answers as Record<string, Temperament>);
  }
}

const TEMPERAMENTS = new Set<unknown>(["sanguine", "choleric", "phlegmatic", "melancholic"]);

/** Keeps only known item ids with values valid for the test, so stored answers can't carry arbitrary payloads. */
export function cleanTestAnswers(kind: TestKind, answers: Record<string, unknown>): Record<string, number | string> {
  const ids: Set<string> = new Set(
    (kind === "bigfive" ? BIG_FIVE_ITEMS : kind === "mbti" ? MBTI_ITEMS : TEMPERAMENT_ITEMS).map((i) => i.id),
  );
  const valid = (v: unknown) =>
    kind === "bigfive" ? Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5 : kind === "mbti" ? v === "a" || v === "b" : TEMPERAMENTS.has(v);
  return Object.fromEntries(Object.entries(answers).filter(([id, v]) => ids.has(id) && valid(v))) as Record<string, number | string>;
}

export function isTestKind(v: string): v is TestKind {
  return (TEST_KINDS as string[]).includes(v);
}
