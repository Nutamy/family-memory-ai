"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PersonalityReport } from "@/lib/report";
import { TEMPERAMENT_LABELS, type Temperament } from "@/lib/tests/temperament";

const tooltipStyle = {
  contentStyle: {
    background: "rgb(var(--card))",
    border: "1px solid rgb(var(--border))",
    borderRadius: 16,
    color: "rgb(var(--foreground))",
    fontFamily: "Nunito, sans-serif",
  },
  labelStyle: { color: "rgb(var(--foreground))", fontWeight: 700 },
};
// Short axis labels so they fit around the radar on narrow cards.
const SHORT: Record<string, string> = {
  openness: "Открытость",
  conscientiousness: "Добросовестность",
  extraversion: "Экстраверсия",
  agreeableness: "Доброжелательность",
  neuroticism: "Чувствительность",
};
const tick = { fill: "rgb(var(--muted-foreground))", fontSize: 12, fontFamily: "Nunito, sans-serif" };

/** Greedy word wrap: long axis labels ("Свобода и независимость") break into short lines instead of running off the card. */
function wrapLabel(text: string, max = 14) {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines[lines.length - 1];
    if (last && (last + " " + word).length <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

interface TickProps {
  x?: number;
  y?: number;
  cy?: number;
  textAnchor?: "start" | "middle" | "end" | "inherit";
  payload?: { value: string };
}

function WrappedTick({ x = 0, y = 0, cy = 0, textAnchor, payload }: TickProps) {
  const lines = wrapLabel(payload?.value ?? "");
  const lh = 13;
  // Labels above the centre grow upwards, below it downwards, so they never cover the polygon.
  const dy = y < cy - 1 ? -(lines.length - 1) * lh : y > cy + 1 ? 4 : -((lines.length - 1) * lh) / 2;
  return (
    <text x={x} y={y + dy} textAnchor={textAnchor} fill={tick.fill} fontSize={11} fontFamily={tick.fontFamily} dominantBaseline="central">
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i ? lh : 0}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

export function BigFiveRadar({ data }: { data: NonNullable<PersonalityReport["bigFive"]> }) {
  return (
    <ResponsiveContainer width="100%" aspect={1.3} maxHeight={320}>
      <RadarChart
        data={data.map((d) => ({ trait: SHORT[d.trait] ?? d.title, value: d.value }))}
        outerRadius="72%"
        margin={{ top: 16, right: 48, bottom: 16, left: 48 }}
      >
        <PolarGrid stroke="rgb(var(--foreground) / .12)" />
        <PolarAngleAxis dataKey="trait" tick={<WrappedTick />} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="value" name="Балл" stroke="#C15C46" fill="#C15C46" fillOpacity={0.35} strokeWidth={2} />
        <Tooltip {...tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function PrioritiesRadar({ data }: { data: PersonalityReport["priorities"] }) {
  return (
    <ResponsiveContainer width="100%" aspect={1.15} maxHeight={380}>
      <RadarChart data={data} outerRadius="72%" margin={{ top: 24, right: 48, bottom: 24, left: 48 }}>
        <PolarGrid stroke="rgb(var(--foreground) / .12)" />
        <PolarAngleAxis dataKey="label" tick={<WrappedTick />} />
        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
        <Radar dataKey="value" name="Важность" stroke="#5E8357" fill="#5E8357" fillOpacity={0.35} strokeWidth={2} />
        <Tooltip {...tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function TemperamentPie({ scores }: { scores: Record<Temperament, number> }) {
  const data = (Object.keys(TEMPERAMENT_LABELS) as Temperament[])
    .map((t) => ({ name: TEMPERAMENT_LABELS[t].title, value: scores[t], color: TEMPERAMENT_LABELS[t].color }))
    .filter((d) => d.value > 0);
  return (
    // Radii in % of the square box, so the ring never gets clipped in a narrow card column.
    <ResponsiveContainer width="100%" aspect={1}>
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="98%" paddingAngle={3} stroke="none" isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function EmotionsBar({ data }: { data: PersonalityReport["emotions"] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        {/* Scale to the largest count, so bars fill the card instead of a rounded-up axis. */}
        <XAxis type="number" hide allowDecimals={false} domain={[0, "dataMax"]} />
        <YAxis type="category" dataKey="name" tick={tick} width={110} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "rgb(var(--foreground) / .05)" }} />
        <Bar dataKey="count" name="Воспоминаний" radius={[0, 999, 999, 0]} fill="#E2A34A" barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
