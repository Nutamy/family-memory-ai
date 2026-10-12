import { floatTo16BitPCM } from "./wav";

const SUPPORTED = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];

/** Encodes mono PCM to MP3 in the browser, yielding to keep the UI responsive. */
export async function encodeMp3(
  samples: Float32Array,
  sampleRate: number,
  kbps = 128,
  onProgress?: (ratio: number) => void,
): Promise<Blob | null> {
  if (!SUPPORTED.includes(sampleRate)) return null;
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const encoder = new Mp3Encoder(1, sampleRate, kbps);
  const pcm = floatTo16BitPCM(samples);
  const block = 1152;
  const parts: Uint8Array[] = [];
  for (let i = 0, n = 0; i < pcm.length; i += block, n++) {
    const buf = encoder.encodeBuffer(pcm.subarray(i, i + block));
    if (buf.length) parts.push(new Uint8Array(buf));
    if (n % 200 === 0) {
      onProgress?.(i / pcm.length);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  const end = encoder.flush();
  if (end.length) parts.push(new Uint8Array(end));
  onProgress?.(1);
  return new Blob(parts as BlobPart[], { type: "audio/mpeg" });
}
