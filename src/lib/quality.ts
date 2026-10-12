// Heuristic audio quality assessment for voice-clone readiness.

export interface QualityInput {
  sampleRate: number;
  rmsDb: number;
  peakDb: number;
  clipping: number; // share of clipped samples, 0..1
  duration: number;
}

export type QualityLevel = "excellent" | "good" | "poor";

export const QUALITY_LABELS: Record<QualityLevel, string> = {
  excellent: "Отличное",
  good: "Хорошее",
  poor: "Требует внимания",
};

export function assessQuality(r: QualityInput): { level: QualityLevel; score: number; issues: string[] } {
  let score = 100;
  const issues: string[] = [];
  if (r.sampleRate && r.sampleRate < 44100) {
    score -= 20;
    issues.push("низкая частота дискретизации");
  }
  if (r.rmsDb < -38) {
    score -= 30;
    issues.push("слишком тихо — говорите ближе к микрофону");
  } else if (r.rmsDb < -30) {
    score -= 12;
    issues.push("тихая запись");
  }
  if (r.clipping > 0.005 || r.peakDb > -0.3) {
    score -= 30;
    issues.push("перегруз — отодвиньтесь от микрофона");
  }
  if (r.duration < 5) {
    score -= 10;
    issues.push("очень короткая запись");
  }
  score = Math.max(0, score);
  const level: QualityLevel = score >= 85 ? "excellent" : score >= 60 ? "good" : "poor";
  return { level, score, issues };
}

// Rough guidance for ElevenLabs voice cloning.
export const ELEVENLABS_TARGETS = {
  instantMinutes: 1,
  professionalMinutes: 30,
  idealMinutes: 120,
};
