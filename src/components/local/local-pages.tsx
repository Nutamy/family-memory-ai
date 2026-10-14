"use client";

// Pages of an on-device archive. The shell loads the whole person from IndexedDB, reloads it after
// every change the service worker reports, and the pages render the same views as the account pages.
import { useParams, useRouter } from "next/navigation";
import { createContext, useContext, useEffect } from "react";
import { PersonSidebar } from "@/components/layout/person-sidebar";
import { ExportView } from "@/components/views/export-view";
import { PersonOverview } from "@/components/views/person-overview";
import { ReportView } from "@/components/views/report-view";
import { FavoritesView, MemoriesView, ModuleView, TestsView, toAnswerDTO, toTestStates, VoiceView } from "@/components/views/section-views";
import type { PersonBundle } from "@/lib/data";
import { toMemoryDTO, toVoiceDTO } from "@/lib/dto";
import { buildExportStats } from "@/lib/export";
import { buildPersonaPrompt } from "@/lib/integrations/persona";
import { loadLocalBundle, progressInputOf } from "@/lib/local/bundle";
import { useLocalData } from "@/lib/local/client";
import { computeProgress } from "@/lib/progress";
import { getModule, moduleHref } from "@/lib/questionnaire";
import { buildReport } from "@/lib/report";
import { LocalLoading } from "./local-gate";

const BundleContext = createContext<PersonBundle | null>(null);

const useBundle = () => useContext(BundleContext)!;

const newestFirst = <T extends { createdAt: Date }>(list: T[]) => [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

export function LocalPersonShell({ personId, children }: { personId: string; children: React.ReactNode }) {
  const router = useRouter();
  const bundle = useLocalData(`person:${personId}`, () => loadLocalBundle(personId), true);
  useEffect(() => {
    if (bundle === null) router.replace("/local");
  }, [bundle, router]);
  if (!bundle) return <LocalLoading />;

  return (
    <div className="container flex gap-8">
      <PersonSidebar
        personId={personId}
        name={`${bundle.firstName} ${bundle.lastName}`.trim()}
        progress={computeProgress(progressInputOf(bundle))}
      />
      <main className="min-w-0 flex-1 py-8 pb-28 sm:py-10">
        <BundleContext.Provider value={bundle}>{children}</BundleContext.Provider>
      </main>
    </div>
  );
}

export function LocalOverviewPage() {
  const b = useBundle();
  return <PersonOverview person={b} progress={computeProgress(progressInputOf(b))} memoriesCount={b.memories.length} />;
}

export function LocalModulePage() {
  const b = useBundle();
  const router = useRouter();
  const { module: slug } = useParams<{ module: string }>();
  const m = getModule(slug);
  const questions = m?.kind === "questions";
  useEffect(() => {
    if (!questions) router.replace(m ? moduleHref(b.id, slug) : `/local/p/${b.id}`);
  }, [questions, m, b.id, slug, router]);
  if (!m || !questions) return null;

  const ids = new Set((m.questions ?? []).map((q) => q.id));
  return (
    // key: a fresh mount per section, so autosave state never leaks between sections.
    <ModuleView
      key={slug}
      personId={b.id}
      module={m}
      person={b}
      answers={b.answers.filter((a) => ids.has(a.questionId)).map(toAnswerDTO)}
      records={newestFirst(b.voiceRecords.filter((v) => v.questionId && ids.has(v.questionId))).map(toVoiceDTO)}
      progress={computeProgress(progressInputOf(b)).modules[slug]}
    />
  );
}

export function LocalTestsPage() {
  const b = useBundle();
  return <TestsView personId={b.id} initial={toTestStates(b.testResults)} />;
}

export function LocalMemoriesPage() {
  const b = useBundle();
  return <MemoriesView personId={b.id} initial={b.memories.map(toMemoryDTO)} />;
}

export function LocalVoicePage() {
  const b = useBundle();
  return <VoiceView personId={b.id} initial={newestFirst(b.voiceRecords).map(toVoiceDTO)} />;
}

export function LocalFavoritesPage() {
  const b = useBundle();
  return <FavoritesView personId={b.id} initial={b.favorites.map((f) => ({ id: f.id, kind: f.kind, title: f.title, note: f.note }))} />;
}

export function LocalReportPage() {
  const b = useBundle();
  return <ReportView personId={b.id} report={buildReport(b)} />;
}

export function LocalExportPage() {
  const b = useBundle();
  return (
    <ExportView
      personId={b.id}
      stats={buildExportStats(b)}
      prompt={buildPersonaPrompt(b, buildReport(b))}
      integrations={{ voiceClone: null, llm: null }}
      local
    />
  );
}
