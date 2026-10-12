"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeSamples, encodeWav, type AudioStats } from "./wav";

export type RecorderStatus = "idle" | "requesting" | "recording" | "paused" | "stopped" | "error";

export interface Recording {
  samples: Float32Array;
  sampleRate: number;
  duration: number;
  wav: Blob;
  url: string;
  stats: AudioStats;
}

// Inline AudioWorklet: forwards raw PCM frames to the main thread.
const WORKLET = `
class FmRecorder extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("fm-recorder", FmRecorder);
`;

const BARS = 48;

/** Microphone recorder built on the Web Audio API (pause / resume / re-record). */
export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));
  const [recording, setRecording] = useState<Recording | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const samplesRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const teardown = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    nodeRef.current?.disconnect();
    analyserRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    nodeRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
  }, []);

  useEffect(() => () => teardown(), [teardown]);
  useEffect(() => () => {
    if (recording) URL.revokeObjectURL(recording.url);
  }, [recording]);

  const meter = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !ctx) return;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    // Map roughly -60..0 dB to 0..1 for the visual meter.
    const level = Math.max(0, Math.min(1, (20 * Math.log10(rms || 1e-6) + 60) / 60));
    if (!pausedRef.current) {
      setLevels((prev) => [...prev.slice(1), level]);
      setElapsed(samplesRef.current / ctx.sampleRate);
    }
    rafRef.current = requestAnimationFrame(meter);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (recording) URL.revokeObjectURL(recording.url);
    setRecording(null);
    chunksRef.current = [];
    samplesRef.current = 0;
    pausedRef.current = false;
    setElapsed(0);
    setLevels(Array(BARS).fill(0));
    setStatus("requesting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Браузер не поддерживает запись звука");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: true },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      const push = (data: Float32Array) => {
        if (pausedRef.current) return;
        chunksRef.current.push(data);
        samplesRef.current += data.length;
      };

      if (ctx.audioWorklet) {
        const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
        await ctx.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        const node = new AudioWorkletNode(ctx, "fm-recorder");
        node.port.onmessage = (e) => push(e.data as Float32Array);
        source.connect(node);
        nodeRef.current = node;
      } else {
        // Fallback for older browsers.
        const node = ctx.createScriptProcessor(4096, 1, 1);
        node.onaudioprocess = (e) => push(new Float32Array(e.inputBuffer.getChannelData(0)));
        source.connect(node);
        node.connect(ctx.destination);
        nodeRef.current = node;
      }
      setStatus("recording");
      rafRef.current = requestAnimationFrame(meter);
    } catch (e) {
      teardown();
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Нет доступа к микрофону. Разрешите его в настройках браузера."
          : e instanceof Error
            ? e.message
            : "Не удалось начать запись";
      setError(msg);
      setStatus("error");
    }
  }, [meter, recording, teardown]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setStatus("recording");
  }, []);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    const sampleRate = ctx?.sampleRate ?? 48000;
    teardown();
    const total = samplesRef.current;
    const samples = new Float32Array(total);
    let offset = 0;
    for (const c of chunksRef.current) {
      samples.set(c, offset);
      offset += c.length;
    }
    chunksRef.current = [];
    if (!total) {
      setStatus("idle");
      return;
    }
    const wav = encodeWav(samples, sampleRate);
    setRecording({
      samples,
      sampleRate,
      duration: total / sampleRate,
      wav,
      url: URL.createObjectURL(wav),
      stats: analyzeSamples(samples),
    });
    setStatus("stopped");
  }, [teardown]);

  const reset = useCallback(() => {
    teardown();
    setRecording(null);
    setElapsed(0);
    setLevels(Array(BARS).fill(0));
    setStatus("idle");
  }, [teardown]);

  return { status, error, elapsed, levels, recording, start, pause, resume, stop, reset };
}
