import type { ChatMessage, LLMProvider } from "./types";

/** Local LLMs through Ollama's chat API (https://github.com/ollama/ollama). */
export class OllamaProvider implements LLMProvider {
  readonly id = "ollama";

  constructor(
    private baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    private model = process.env.OLLAMA_MODEL || "llama3.1",
  ) {}

  async chat(messages: ChatMessage[], opts?: { temperature?: number }) {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, messages, stream: false, options: { temperature: opts?.temperature ?? 0.7 } }),
    });
    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.message?.content ?? "";
  }
}
