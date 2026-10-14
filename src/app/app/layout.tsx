import { AppHeader } from "@/components/layout/app-header";
import { requireUser } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <AppHeader email={user.email} />
      {children}
    </>
  );
}
