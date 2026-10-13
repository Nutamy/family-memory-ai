import { VoiceView } from "@/components/views/section-views";
import { requirePerson } from "@/lib/auth";
import { db } from "@/lib/db";
import { toVoiceDTO } from "@/lib/dto";

export const metadata = { title: "Голосовой архив" };

export default async function VoicePage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  await requirePerson(personId);
  const records = await db.voiceRecord.findMany({ where: { personId }, orderBy: { createdAt: "desc" } });
  return <VoiceView personId={personId} initial={records.map(toVoiceDTO)} />;
}
