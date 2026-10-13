// Bundles the service worker of on-device archives (src/lib/local/sw.ts) into public/sw.js.
// Runs before `next dev` and `next build`; the output is generated, not committed.
import { build } from "esbuild";

build({
  entryPoints: ["src/lib/local/sw.ts"],
  outfile: "public/sw.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: process.env.NODE_ENV === "production" || process.argv.includes("--minify"),
  legalComments: "none",
  logLevel: "warning",
}).then(
  () => console.log("✓ service worker → public/sw.js"),
  () => process.exit(1),
);
