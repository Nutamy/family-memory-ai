// Plain serializable shapes passed from server components to client components.
// Shared with the in-browser API of local archives (src/lib/local), so no server imports here.
import { z } from "zod";

export interface VoiceRecordDTO {
  id: string;
  title: string;
  topic: string;
  transcription: string;
  duration: number;
  sampleRate: number;
  peakDb: number;
  rmsDb: number;
  clipping: number;
  hasMp3: boolean;
  questionId: string | null;
  memoryId: string | null;
  createdAt: string;
}

export function toVoiceDTO(v: {
  id: string;
  title: string;
  topic: string;
  transcription: string;
  duration: number;
  sampleRate: number;
  peakDb: number;
  rmsDb: number;
  clipping: number;
  mp3Key: string | null;
  questionId: string | null;
  memoryId: string | null;
  createdAt: Date;
}): VoiceRecordDTO {
  return {
    id: v.id,
    title: v.title,
    topic: v.topic,
    transcription: v.transcription,
    duration: v.duration,
    sampleRate: v.sampleRate,
    peakDb: v.peakDb,
    rmsDb: v.rmsDb,
    clipping: v.clipping,
    hasMp3: !!v.mp3Key,
    questionId: v.questionId,
    memoryId: v.memoryId,
    createdAt: v.createdAt.toISOString(),
  };
}

export interface AnswerDTO {
  questionId: string;
  text: string;
  value: unknown;
  voiceRecordId: string | null;
}

export interface TagDTO {
  id: string;
  name: string;
  color: string;
}

export interface MemoryDTO {
  id: string;
  title: string;
  content: string;
  period: string;
  place: string;
  people: string;
  emotion: string;
  tags: TagDTO[];
  voiceRecords: VoiceRecordDTO[];
  createdAt: string;
}

export interface FavoriteDTO {
  id: string;
  kind: string;
  title: string;
  note: string;
}

export const memorySchema = z.object({
  title: z.string().trim().min(1, "Добавьте заголовок").max(300),
  content: z.string().max(100_000).default(""),
  period: z.string().trim().max(200).default(""),
  place: z.string().trim().max(200).default(""),
  people: z.string().trim().max(500).default(""),
  emotion: z.string().trim().max(50).default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
});

export function toMemoryDTO(m: {
  id: string;
  title: string;
  content: string;
  period: string;
  place: string;
  people: string;
  emotion: string;
  createdAt: Date;
  tags: { id: string; name: string; color: string }[];
  voiceRecords: Parameters<typeof toVoiceDTO>[0][];
}): MemoryDTO {
  return {
    id: m.id,
    title: m.title,
    content: m.content,
    period: m.period,
    place: m.place,
    people: m.people,
    emotion: m.emotion,
    tags: m.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    voiceRecords: m.voiceRecords.map(toVoiceDTO),
    createdAt: m.createdAt.toISOString(),
  };
}

