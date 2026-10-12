import { assertPersonAccess } from "@/lib/auth";
import { route } from "@/lib/api";
import { loadPersonBundle } from "@/lib/data";
import { buildProfileJson } from "@/lib/export";
import { slugifyFile } from "@/lib/utils";

export const GET = route<{ id: string }>(async (_req, { id }) => {
  await assertPersonAccess(id);
  const bundle = await loadPersonBundle(id);
  const json = JSON.stringify(buildProfileJson(bundle), null, 2);
  const name = `${slugifyFile(`${bundle.firstName} ${bundle.lastName}`)}-profile.json`;
  return new Response(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="profile.json"; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
});
