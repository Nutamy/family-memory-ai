import type { VoiceCloneProvider } from "./types";

const BASE = "https://api.elevenlabs.io/v1";

/** ElevenLabs Instant Voice Clone + TTS. Feed it the exported WAV/MP3 records. */
export class ElevenLabsProvider implements VoiceCloneProvider {
  readonly id = "elevenlabs";

  constructor(private apiKey: string) {}

  async createVoice(name: string, samples: { data: Buffer; filename: string }[], description?: string) {
    const form = new FormData();
    form.append("name", name);
    if (description) form.append("description", description);
    for (const s of samples) form.append("files", new Blob([new Uint8Array(s.data)]), s.filename);
    const res = await fetch(`${BASE}/voices/add`, { method: "POST", headers: { "xi-api-key": this.apiKey }, body: form });
    if (!res.ok) throw new Error(`ElevenLabs error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return { voiceId: String(json.voice_id) };
  }

  async synthesize(voiceId: string, text: string) {
    const res = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": this.apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
    });
    if (!res.ok) throw new Error(`ElevenLabs TTS error ${res.status}: ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }
}
