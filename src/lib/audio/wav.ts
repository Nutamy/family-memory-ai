// 16-bit PCM mono WAV encoder.
export function floatTo16BitPCM(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const pcm = floatTo16BitPCM(samples);
  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  write(36, "data");
  view.setUint32(40, pcm.length * 2, true);
  new Int16Array(buffer, 44).set(pcm);
  return new Blob([buffer], { type: "audio/wav" });
}

export interface AudioStats {
  peakDb: number;
  rmsDb: number;
  clipping: number;
}

export function analyzeSamples(samples: Float32Array): AudioStats {
  let peak = 0;
  let sumSq = 0;
  let clipped = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
    if (a >= 0.999) clipped++;
    sumSq += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sumSq / (samples.length || 1));
  const db = (x: number) => (x > 0 ? Math.round(20 * Math.log10(x) * 10) / 10 : -96);
  return { peakDb: db(peak), rmsDb: db(rms), clipping: samples.length ? clipped / samples.length : 0 };
}
