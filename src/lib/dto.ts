// Plain serializable shapes passed from server components to client components.

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
