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
      <span className={cn("whitespace-nowrap font-sans font-bold uppercase tracking-[0.2em]", compact ? "text-[11px]" : "text-sm")}>
        Семейная память
      </span>
    </span>
  );
}

export const ILLUSTRATIONS = {
  bird: [505, 389],
  butterfly: [337, 358],
  star: [95, 97],
  "star-small": [75, 77],
  moon: [180, 222],
  bear: [586, 425],
  bunny: [640, 457],
  mushrooms: [292, 256],
  "bee-trail": [374, 92],
  ladybug: [326, 326],
  daisy: [229, 526],
  squirrel: [445, 441],
  wildflowers: [348, 390],
  leaf: [483, 324],
  "leaf-birch": [244, 324],
  "leaf-maple": [304, 298],
  "leaf-oak": [251, 373],
  cloud: [438, 178],
  blueberries: [241, 344],
  fox: [526, 640],
  berries: [440, 640],
  moth: [240, 190],
  hedgehog: [407, 358],
} as const;

export type IllustrationName = keyof typeof ILLUSTRATIONS;

/** Hand-painted watercolor illustration cut out from the brand sheets (public/illustrations). */
export function Illustration({ name, className, style, priority }: P & { name: IllustrationName; priority?: boolean }) {
  const [w, h] = ILLUSTRATIONS[name];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/illustrations/${name}.webp`}
      width={w}
      height={h}
      alt=""
      aria-hidden
      draggable={false}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("pointer-events-none h-auto select-none", className)}
      style={style}
    />
  );
}

const LEAF_BY_COLOR: Record<string, IllustrationName> = {
  "#C15C46": "leaf-maple",
  "#5E8357": "leaf-oak",
};

export function Leaf({ className, style, color }: P & { color?: string }) {
  return <Illustration name={(color && LEAF_BY_COLOR[color]) || "leaf"} className={className} style={style} />;
}

export function Bird({ className, style }: P) {
  return <Illustration name="bird" className={className} style={style} />;
}

export function Butterfly({ className, style }: P) {
  return <Illustration name="butterfly" className={className} style={style} />;
}

export function Berries({ className, style }: P) {
  return <Illustration name="berries" className={className} style={style} />;
}

export function Sprig({ className, style }: P) {
  return <Illustration name="wildflowers" className={className} style={style} />;
}

export function Sparkles({ className, style }: P) {
  return (
    <span className={cn("relative block aspect-[4/3]", className)} style={style} aria-hidden>
      <Illustration name="star" className="absolute left-0 top-[30%] w-[45%]" />
      <Illustration name="star-small" className="absolute right-[5%] top-0 w-[30%]" />
      <Illustration name="star-small" className="absolute bottom-0 right-[25%] w-[22%] rotate-12" />
    </span>
  );
}

/** Torn watercolor brush stroke used as a section divider (hills / waves). */
export function BrushDivider({ className, tone = "green" }: { className?: string; tone?: "green" | "blue" | "mist" }) {
  // The front stroke and the base strip use exactly the adjacent section's color (incl. dark theme),
  // so the divider merges into the section without a visible seam.
  const { back, front } = {
    green: { back: "#5E8357", front: "fill-[#2D4B39] dark:fill-[#16261d]" },
    blue: { back: "#2E4A72", front: "fill-navy" },
    mist: { back: "#D8E5DB", front: "fill-[#BFD3C4]" },
  }[tone];
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className={cn("relative -my-px block h-16 w-full sm:h-24", className)} aria-hidden>
      {/* Paths overshoot the viewBox: the displacement filter samples beyond the edges and would tear holes there. */}
      <g filter="url(#wc-rough)">
        <path d="M-40 60C120 30 220 80 360 56s260-50 400-20 300 40 440 10l40-4V150H-40Z" fill={back} opacity=".55" />
        <path d="M-40 84c180-30 300 10 460-6s300-40 460-14 240 20 320 6l40-2V150H-40Z" className={front} />
      </g>
      {/* Unfiltered base: guarantees a solid edge where the divider meets the section. */}
      <rect x="0" y="100" width="1200" height="20" className={front} />
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
