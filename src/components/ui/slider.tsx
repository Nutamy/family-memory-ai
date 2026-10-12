"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export function Slider({
  value,
  min = 0,
  max = 10,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  value: number | null;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const unset = value == null;
  return (
    <SliderPrimitive.Root
      min={min}
      max={max}
      step={1}
      value={[unset ? Math.round((min + max) / 2) : value]}
      onValueChange={(v) => onChange(v[0])}
      className={cn("relative flex h-6 w-full touch-none select-none items-center", className)}
    >
      <SliderPrimitive.Track className="relative h-2 grow overflow-hidden rounded-full bg-foreground/10">
        <SliderPrimitive.Range className={cn("absolute h-full rounded-full bg-gradient-to-r from-gold to-primary", unset && "opacity-0")} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        className={cn(
          "focus-ring block size-6 rounded-full border-4 border-card bg-primary shadow-md transition-transform hover:scale-110",
          unset && "bg-muted-foreground/50",
        )}
      />
    </SliderPrimitive.Root>
  );
}
