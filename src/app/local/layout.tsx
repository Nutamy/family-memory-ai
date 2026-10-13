import { LocalGate } from "@/components/local/local-gate";
import { AppHeader } from "@/components/layout/app-header";
import { getSessionUserId } from "@/lib/auth";

export const metadata = { robots: { index: false } };

// On-device archives: no account needed. Data lives in IndexedDB and is served by the service worker.
export default async function LocalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader local loggedIn={!!(await getSessionUserId())} />
      <LocalGate>{children}</LocalGate>
    </>
  );
}
