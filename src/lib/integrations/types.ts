// Provider contracts for future AI features. Implementations live next to this file
// and are selected by env configuration in ./index.ts.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Text generation: OpenAI, local models via Ollama, etc. */
export interface LLMProvider {
  readonly id: string;
  chat(messages: ChatMessage[], opts?: { temperature?: number }): Promise<string>;
}

/** Speech-to-text for voice records. */
export interface TranscriptionProvider {
  readonly id: string;
  transcribe(audio: Buffer, filename: string, language?: string): Promise<string>;
}

/** Voice cloning and synthesis (ElevenLabs). */
export interface VoiceCloneProvider {
  readonly id: string;
  createVoice(name: string, samples: { data: Buffer; filename: string }[], description?: string): Promise<{ voiceId: string }>;
  synthesize(voiceId: string, text: string): Promise<Buffer>;
}

/** Talking-head avatar generation (HeyGen, D-ID, SadTalker…). */
export interface AvatarProvider {
  readonly id: string;
  createTalkingVideo(input: { photo: Buffer; audio: Buffer }): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<{ status: "pending" | "done" | "failed"; url?: string }>;
}
