"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn, formatDuration } from "@/lib/utils";

/** Compact player in the UI-kit style: round terracotta play button + seek bar. */
export function AudioPlayer({ src, duration: knownDuration, className }: { src: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(knownDuration ?? 0);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => Number.isFinite(a.duration) && a.duration > 0 && setDuration(a.duration);
    const onEnd = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("pause", onEnd);
    a.addEventListener("play", onPlay);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("pause", onEnd);
      a.removeEventListener("play", onPlay);
    };
  }, [src]);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      // Only one player at a time across the page.
      document.querySelectorAll("audio").forEach((el) => el !== a && el.pause());
      void a.play();
    } else a.pause();
  };

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <audio ref={ref} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Пауза" : "Слушать"}
        className="focus-ring grid size-10 shrink-0 place-items-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105"
      >
        {playing ? <Pause className="size-4 fill-white" /> : <Play className="ml-0.5 size-4 fill-white" />}
      </button>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={time}
        aria-label="Позиция"
        onChange={(e) => {
          if (ref.current) ref.current.currentTime = Number(e.target.value);
        }}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-foreground/10"
        style={{ background: `linear-gradient(to right, rgb(var(--primary)) ${pct}%, rgb(var(--foreground) / .1) ${pct}%)` }}
      />
      <span className="w-[84px] shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {formatDuration(time)} / {formatDuration(duration)}
      </span>
    </div>
  );
}
