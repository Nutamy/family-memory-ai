import { buildArchiveZip, archiveBaseName } from "@/lib/archive";
import { assertPersonAccess } from "@/lib/auth";
import { route } from "@/lib/api";
import { loadPersonBundle } from "@/lib/data";

/** ?type=audio — recordings only; ?type=full — recordings + profile.json, persona prompt and photo. */
export const GET = route<{ id: string }>(async (req, { id }) => {
  await assertPersonAccess(id);
  const full = new URL(req.url).searchParams.get("type") === "full";
  const bundle = await loadPersonBundle(id);
  const data = await buildArchiveZip(bundle, { full });
  const name = `${archiveBaseName(bundle)}-${full ? "archive" : "audio"}.zip`;
  return new Response(data as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${full ? "archive" : "audio"}.zip"; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
});
