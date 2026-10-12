import type { ChatMessage, LLMProvider, TranscriptionProvider } from "./types";

const BASE = "https://api.openai.com/v1";

export class OpenAIProvider implements LLMProvider, TranscriptionProvider {
  readonly id = "openai";

  constructor(
    private apiKey: string,
    private model = process.env.OPENAI_MODEL || "gpt-4o-mini",
  ) {}

  async chat(messages: ChatMessage[], opts?: { temperature?: number }) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, messages, temperature: opts?.temperature ?? 0.7 }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? "";
  }

  async transcribe(audio: Buffer, filename: string, language = "ru") {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(audio)]), filename);
    form.append("model", "whisper-1");
    form.append("language", language);
    const res = await fetch(`${BASE}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    if (!res.ok) throw new Error(`OpenAI transcription error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return String(json.text ?? "");
  }
}
