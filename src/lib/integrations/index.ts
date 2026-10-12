import "server-only";
import { ElevenLabsProvider } from "./elevenlabs";
import { OllamaProvider } from "./ollama";
import { OpenAIProvider } from "./openai";
import { botToken } from "./telegram";
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

export function integrationStatus() {
  return {
    llm: getLLMProvider()?.id ?? null,
    transcription: getTranscriptionProvider()?.id ?? null,
    voiceClone: getVoiceCloneProvider()?.id ?? null,
    avatar: null as string | null,
    telegram: !!botToken(),
  };
}

export type * from "./types";
