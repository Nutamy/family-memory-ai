// Hand-drawn, watercolor-like decor from the UI kit: leaves, birds, butterflies,
// berry sprigs, sparkles and torn brush-stroke dividers. Pure SVG, no assets.
import { cn } from "@/lib/utils";

type P = { className?: string; style?: React.CSSProperties };

/** Shared SVG filters; render once in the root layout. */
export function WatercolorDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <filter id="wc" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.35" />
        </filter>
        <filter id="wc-rough" x="-5%" y="-30%" width="110%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.12" numOctaves="4" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" />
        </filter>
        <filter id="wc-grain">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" result="g" />
          <feComposite in="SourceGraphic" in2="g" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex flex-col items-center leading-none text-foreground", className)}>
      <svg viewBox="0 0 40 22" className="mb-1 h-4 w-8 text-grass" aria-hidden>
        <path d="M20 21c0-8-5-14-14-16 1 9 6 14 14 16Z" fill="currentColor" opacity=".85" />
        <path d="M20 21c0-8 5-14 14-16-1 9-6 14-14 16Z" fill="currentColor" opacity=".6" />
        <path d="M20 21V9" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span className={cn("font-sans font-bold uppercase tracking-[0.28em]", compact ? "text-[11px]" : "text-sm")}>
        Family Memory
      </span>
    </span>
  );
}

export function Leaf({ className, style, color = "#D99543" }: P & { color?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden filter="url(#wc)">
      <path d="M8 56C10 30 26 10 56 8c-2 28-20 46-48 48Z" fill={color} opacity=".85" />
      <path d="M8 56C24 40 38 26 52 12" stroke="#7a4a1a" strokeOpacity=".45" strokeWidth="1.4" fill="none" />
      <path d="M20 44c4-1 9-1 14 1M28 36c3-2 8-2 12-1M24 40c0-4 1-8 3-11M34 30c0-4 1-7 3-10" stroke="#7a4a1a" strokeOpacity=".3" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function Bird({ className, style }: P) {
  return (
    <svg viewBox="0 0 120 80" className={className} style={style} aria-hidden>
      <g filter="url(#wc)">
        <path d="M30 46c0-14 12-24 28-22 10 1 16 6 20 12l14-4-8 10c2 12-8 22-26 22-16 0-28-6-28-18Z" fill="#E2A34A" />
        <path d="M44 40c10-16 26-22 40-20-6 10-16 18-30 22Z" fill="#D99543" />
        <path d="M30 50c-8 2-14 0-20-4 6 8 12 10 20 10Z" fill="#C88838" />
        <circle cx="80" cy="34" r="2.2" fill="#1D314F" />
        <path d="M90 34l8 2-8 3Z" fill="#C15C46" />
      </g>
      <path d="M8 70c10-6 18-6 28 0" stroke="#1D314F" strokeOpacity=".35" strokeDasharray="3 5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Butterfly({ className, style }: P) {
  return (
    <svg viewBox="0 0 80 64" className={className} style={style} aria-hidden>
      <g filter="url(#wc)">
        <path d="M38 30C30 12 14 4 6 10s2 26 14 26c-8 4-10 16-2 18 8 2 16-8 20-18Z" fill="#D9803A" />
        <path d="M42 30C50 12 66 4 74 10s-2 26-14 26c8 4 10 16 2 18-8 2-16-8-20-18Z" fill="#E2913F" />
        <path d="M12 14c6 2 12 8 16 14M68 14c-6 2-12 8-16 14" stroke="#3a2412" strokeOpacity=".5" fill="none" />
        <circle cx="12" cy="16" r="1.6" fill="#fff" opacity=".8" />
        <circle cx="68" cy="16" r="1.6" fill="#fff" opacity=".8" />
      </g>
      <path d="M40 18v32" stroke="#2b1d12" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 18c-2-6-6-10-10-12M40 18c2-6 6-10 10-12" stroke="#2b1d12" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function Berries({ className, style }: P) {
  return (
    <svg viewBox="0 0 80 100" className={className} style={style} aria-hidden>
      <g filter="url(#wc)">
        <path d="M40 98C40 70 36 40 30 14M38 60c8-8 18-12 28-14M34 36c-8-6-16-8-24-8" stroke="#5a3d2b" strokeWidth="1.6" fill="none" />
        <path d="M44 72c10 0 18-6 22-14-10-2-18 4-22 14Z" fill="#5E8357" />
        <path d="M36 80c-10-2-16-10-18-18 10 0 16 8 18 18Z" fill="#2D4B39" opacity=".85" />
        {[
          [30, 12],
          [24, 8],
          [34, 6],
          [66, 44],
          [72, 40],
          [10, 28],
          [6, 22],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.2" fill="#C15C46" />
        ))}
      </g>
    </svg>
  );
}

export function Sprig({ className, style }: P) {
  return (
    <svg viewBox="0 0 120 140" className={className} style={style} aria-hidden>
      <g filter="url(#wc)">
        <path d="M60 138C58 100 52 60 40 20" stroke="#2D4B39" strokeWidth="2" fill="none" />
        {[
          [44, 34, -40],
          [50, 54, 30],
          [46, 74, -35],
          [56, 92, 35],
          [52, 112, -30],
        ].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="20" ry="7" transform={`rotate(${r} ${x} ${y})`} fill={i % 2 ? "#5E8357" : "#2D4B39"} opacity=".85" />
        ))}
        <path d="M74 138c4-30 14-52 30-70" stroke="#5E8357" strokeWidth="1.6" fill="none" />
        {[
          [92, 84, 40],
          [84, 104, -30],
          [100, 70, 50],
        ].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="14" ry="5" transform={`rotate(${r} ${x} ${y})`} fill="#D99543" opacity=".8" />
        ))}
      </g>
    </svg>
  );
}

export function Sparkles({ className, style }: P) {
  const star = (x: number, y: number, s: number) =>
    `M${x} ${y - s}C${x + s * 0.15} ${y - s * 0.15} ${x + s * 0.15} ${y - s * 0.15} ${x + s} ${y}C${x + s * 0.15} ${y + s * 0.15} ${x + s * 0.15} ${y + s * 0.15} ${x} ${y + s}C${x - s * 0.15} ${y + s * 0.15} ${x - s * 0.15} ${y + s * 0.15} ${x - s} ${y}C${x - s * 0.15} ${y - s * 0.15} ${x - s * 0.15} ${y - s * 0.15} ${x} ${y - s}Z`;
  return (
    <svg viewBox="0 0 80 60" className={className} style={style} aria-hidden>
      <path d={star(20, 30, 12)} fill="#E2A34A" />
      <path d={star(52, 14, 7)} fill="#E2A34A" opacity=".8" />
      <path d={star(62, 44, 9)} fill="#E2A34A" opacity=".9" />
    </svg>
  );
}

/** Torn watercolor brush stroke used as a section divider (hills / waves). */
export function BrushDivider({ className, tone = "green" }: { className?: string; tone?: "green" | "blue" | "mist" }) {
  const fills = {
    green: ["#5E8357", "#2D4B39"],
    blue: ["#2E4A72", "#1D314F"],
    mist: ["#D8E5DB", "#BFD3C4"],
  }[tone];
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className={cn("block h-16 w-full sm:h-24", className)} aria-hidden>
      <g filter="url(#wc-rough)">
        <path d="M0 60C120 30 220 80 360 56s260-50 400-20 300 40 440 10V120H0Z" fill={fills[0]} opacity=".55" />
        <path d="M0 84c140-30 260 10 420-6s300-40 460-14 240 20 320 6V120H0Z" fill={fills[1]} opacity=".75" />
      </g>
    </svg>
  );
}

/** Ambient floating decor for page corners. */
export function DecorScatter({ variant = "default" }: { variant?: "default" | "quiet" }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden>
      <Leaf className="absolute -left-4 top-24 w-16 rotate-[-25deg] animate-float opacity-80 sm:w-20" />
      <Bird className="absolute right-4 top-6 w-20 animate-float [animation-delay:-2s] sm:right-12 sm:w-28" />
      {variant === "default" && (
        <>
          <Sprig className="absolute -left-6 bottom-0 hidden w-28 opacity-70 md:block" />
          <Berries className="absolute -right-2 bottom-10 hidden w-16 opacity-80 md:block" />
          <Sparkles className="absolute left-1/3 top-10 w-14 opacity-70" />
          <Butterfly className="absolute bottom-24 right-1/4 hidden w-10 animate-float [animation-delay:-4s] lg:block" />
        </>
      )}
    </div>
  );
}
