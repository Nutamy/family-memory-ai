import "server-only";
import { ElevenLabsProvider } from "./elevenlabs";
import { OllamaProvider } from "./ollama";
import { OpenAIProvider } from "./openai";
import { telegramConfig } from "./telegram";
import type { LLMProvider, TranscriptionProvider, VoiceCloneProvider } from "./types";

export function getLLMProvider(): LLMProvider | null {
  if (process.env.OPENAI_API_KEY) return new OpenAIProvider(process.env.OPENAI_API_KEY);
  if (process.env.OLLAMA_BASE_URL) return new OllamaProvider();
  return null;
}

export function getTranscriptionProvider(): TranscriptionProvider | null {
  return process.env.OPENAI_API_KEY ? new OpenAIProvider(process.env.OPENAI_API_KEY) : null;
}

export function getVoiceCloneProvider(): VoiceCloneProvider | null {
  return process.env.ELEVENLABS_API_KEY ? new ElevenLabsProvider(process.env.ELEVENLABS_API_KEY) : null;
}

/**
 * Telegram delivers into the operator's own chat, so only allowlisted accounts may use it:
 * otherwise any registered user could push personal data into a chat they don't own.
 * TELEGRAM_ALLOWED_EMAILS: comma-separated emails; empty means nobody.
 */
export function telegramAllowedFor(email: string | null | undefined) {
  if (!telegramConfig() || !email) return false;
  const allowed = (process.env.TELEGRAM_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export function integrationStatus(email?: string | null) {
  return {
    llm: getLLMProvider()?.id ?? null,
    transcription: getTranscriptionProvider()?.id ?? null,
    voiceClone: getVoiceCloneProvider()?.id ?? null,
    avatar: null as string | null,
    telegram: telegramAllowedFor(email),
  };
}

export type * from "./types";
