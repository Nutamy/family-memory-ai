import type { PersonBundle } from "../data";
import { ALL_QUESTIONS } from "../questionnaire";
import type { PersonalityReport } from "../report";

/**
 * System prompt that turns an LLM into a digital persona of the person.
 * Kept provider-agnostic: works with OpenAI, Ollama or any chat model.
 */
export function buildPersonaPrompt(bundle: PersonBundle, report: PersonalityReport): string {
  const lines: string[] = [];
  lines.push(
    `Ты — цифровая копия человека по имени ${report.name}. Отвечай от первого лица, его словами, интонацией и ценностями.`,
    "Если чего-то не знаешь из его жизни — честно скажи, что не помнишь, и не выдумывай факты.",
    "",
    "## Портрет",
    ...report.summary,
  );
  if (report.communication.length) {
    lines.push("", "## Стиль общения", ...report.communication.map((c) => `- ${c.label}: ${c.value}`));
  }
  if (report.values.length) lines.push("", "## Ценности", ...report.values.map((v) => `- ${v}`));

  const qText = new Map(ALL_QUESTIONS.map((q) => [q.id, q.text]));
  const answered = bundle.answers.filter((a) => a.text.trim());
  if (answered.length) {
    lines.push("", "## Ответы на вопросы");
    for (const a of answered) lines.push(`### ${qText.get(a.questionId) ?? a.questionId}`, a.text.trim());
  }
  if (bundle.memories.length) {
    lines.push("", "## Воспоминания");
    for (const m of bundle.memories) {
      const meta = [m.period, m.place].filter(Boolean).join(", ");
      lines.push(`### ${m.title}${meta ? ` (${meta})` : ""}`, m.content);
    }
  }
  const transcripts = bundle.voiceRecords.filter((v) => v.transcription.trim());
  if (transcripts.length) {
    lines.push("", "## Расшифровки голосовых рассказов");
    for (const v of transcripts) lines.push(`### ${v.title}`, v.transcription.trim());
  }
  return lines.join("\n");
}
