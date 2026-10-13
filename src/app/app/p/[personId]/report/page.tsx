import { ReportView } from "@/components/views/report-view";
import { requirePerson } from "@/lib/auth";
import { loadPersonBundle } from "@/lib/data";
import { buildReport } from "@/lib/report";

export const metadata = { title: "Отчёт о личности" };

export default async function ReportPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  await requirePerson(personId);
  return <ReportView personId={personId} report={buildReport(await loadPersonBundle(personId))} />;
}
