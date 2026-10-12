import { BIG_FIVE_ITEMS, scoreBigFive } from "./bigfive";
import { MBTI_ITEMS, scoreMbti } from "./mbti";
import { TEMPERAMENT_ITEMS, scoreTemperament, type Temperament } from "./temperament";

export type TestKind = "bigfive" | "mbti" | "temperament";

export const TEST_KINDS: TestKind[] = ["bigfive", "mbti", "temperament"];

export const TEST_META: Record<TestKind, { title: string; subtitle: string; total: number }> = {
  bigfive: { title: "Big Five", subtitle: "Пять фундаментальных черт личности", total: BIG_FIVE_ITEMS.length },
  mbti: { title: "MBTI", subtitle: "Тип личности по четырём шкалам", total: MBTI_ITEMS.length },
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

export function isTestKind(v: string): v is TestKind {
  return (TEST_KINDS as string[]).includes(v);
}
