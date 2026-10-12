import { ModuleHeader, NextModuleLink } from "@/components/questionnaire/module-header";
import { TrackSection } from "@/components/questionnaire/track-section";
import { VoiceArchive } from "@/components/voice/voice-archive";
import { requirePerson } from "@/lib/auth";
import { db } from "@/lib/db";
import { toVoiceDTO } from "@/lib/dto";
import { getModule } from "@/lib/questionnaire";

export const metadata = { title: "Голосовой архив" };

export default async function VoicePage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  await requirePerson(personId);
  const records = await db.voiceRecord.findMany({ where: { personId }, orderBy: { createdAt: "desc" } });
  return (
    <div className="mx-auto max-w-4xl">
      <TrackSection personId={personId} slug="voice" />
      <ModuleHeader module={getModule("voice")!} />
      <VoiceArchive personId={personId} initial={records.map(toVoiceDTO)} />
      <NextModuleLink personId={personId} slug="voice" />
    </div>
  );
}
