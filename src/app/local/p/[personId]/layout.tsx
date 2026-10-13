import { LocalPersonShell } from "@/components/local/local-pages";

export default async function LocalPersonLayout({ children, params }: { children: React.ReactNode; params: Promise<{ personId: string }> }) {
  return <LocalPersonShell personId={(await params).personId}>{children}</LocalPersonShell>;
}
