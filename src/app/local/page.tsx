import { LocalArchives } from "@/components/local/local-archives";
import { getSessionUserId } from "@/lib/auth";

export const metadata = { title: "Архивы на этом устройстве" };

export default async function LocalArchivesPage() {
  return <LocalArchives loggedIn={!!(await getSessionUserId())} />;
}
