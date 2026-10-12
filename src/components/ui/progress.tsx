"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <ProgressPrimitive.Root value={value} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-foreground/10", className)}>
      <ProgressPrimitive.Indicator
        className={cn("h-full rounded-full bg-gradient-to-r from-gold to-primary transition-all duration-700", barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export function ProgressRing({ value, size = 44, stroke = 4, className }: { value: number; size?: number; stroke?: number; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = value >= 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn("-rotate-90", className)} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-foreground/10" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(100, value) / 100)}
        className={cn("transition-all duration-700", done ? "stroke-grass" : "stroke-primary")}
      />
    </svg>
  );
}
