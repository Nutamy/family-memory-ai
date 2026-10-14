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

export function BigFiveRadar({ data }: { data: NonNullable<PersonalityReport["bigFive"]> }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart
        data={data.map((d) => ({ trait: SHORT[d.trait] ?? d.title, value: d.value }))}
        outerRadius="58%"
        margin={{ top: 10, right: 40, bottom: 10, left: 40 }}
      >
        <PolarGrid stroke="rgb(var(--foreground) / .12)" />
        <PolarAngleAxis dataKey="trait" tick={tick} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="value" name="Балл" stroke="#C15C46" fill="#C15C46" fillOpacity={0.35} strokeWidth={2} />
        <Tooltip {...tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function PrioritiesRadar({ data }: { data: PersonalityReport["priorities"] }) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={data} outerRadius="56%" margin={{ top: 10, right: 60, bottom: 10, left: 60 }}>
        <PolarGrid stroke="rgb(var(--foreground) / .12)" />
        <PolarAngleAxis dataKey="label" tick={{ ...tick, fontSize: 11 }} />
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
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={tick} width={110} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "rgb(var(--foreground) / .05)" }} />
        <Bar dataKey="count" name="Воспоминаний" radius={[0, 999, 999, 0]} fill="#E2A34A" barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
