// Service worker for on-device archives: answers their /api requests from IndexedDB.
// Everything else goes to the network untouched. Bundled to public/sw.js by scripts/build-sw.ts.
import { handleLocalApi, isLocalApiPath } from "./api";

// Minimal worker typings: the project compiles against the DOM lib, which clashes with "webworker".
interface ExtendableEvent extends Event {
  waitUntil(p: Promise<unknown>): void;
}
interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(r: Promise<Response>): void;
}
declare const self: {
  location: Location;
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void>; matchAll(o: { type: "window" }): Promise<{ postMessage(m: unknown): void }[]> };
  addEventListener(type: "install" | "activate", fn: (e: ExtendableEvent) => void): void;
  addEventListener(type: "fetch", fn: (e: FetchEvent) => void): void;
};

self.addEventListener("install", () => void self.skipWaiting());
// Take over open tabs right away: the local pages wait for a controller before fetching.
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || !isLocalApiPath(url.pathname)) return;
  e.respondWith(
    handleLocalApi(e.request).then(async (res) => {
      // Let open pages refresh derived views (sidebar progress) after a change.
      if (e.request.method !== "GET" && res.ok) {
        for (const c of await self.clients.matchAll({ type: "window" })) c.postMessage({ type: "fm:changed" });
      }
      return res;
    }),
  );
});
