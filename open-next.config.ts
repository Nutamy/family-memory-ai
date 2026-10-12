import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache: every page reads per-user data from D1 and renders dynamically.
export default defineCloudflareConfig({});
