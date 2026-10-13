import { ExportView } from "@/components/views/export-view";
import { requirePerson } from "@/lib/auth";
import { loadPersonBundle } from "@/lib/data";
import { buildExportStats } from "@/lib/export";
import { integrationStatus } from "@/lib/integrations";
import { buildPersonaPrompt } from "@/lib/integrations/persona";
import { buildReport } from "@/lib/report";

export const metadata = { title: "Экспорт и ИИ" };

export default async function ExportPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const { user } = await requirePerson(personId);
  const bundle = await loadPersonBundle(personId);
  return (
    <ExportView
      personId={personId}
      stats={buildExportStats(bundle)}
      prompt={buildPersonaPrompt(bundle, buildReport(bundle))}
      integrations={integrationStatus(user.email)}
    />
  );
}
