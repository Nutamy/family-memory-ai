import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Cloudflare request context when running on Workers (or `next dev` with CF_DEV=1),
 * null on a plain Node server — callers fall back to SQLite and local files.
 */
export function cloudflareContext() {
  try {
    return getCloudflareContext();
  } catch {
    return null;
  }
}

export const cloudflareEnv = () => cloudflareContext()?.env ?? null;
