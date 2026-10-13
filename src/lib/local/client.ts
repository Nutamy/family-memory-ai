"use client";

import { useEffect, useRef, useState } from "react";

let connecting: Promise<boolean> | null = null;

/** Registers the service worker and waits until it controls this page (it serves the local API). */
async function connect(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("indexedDB" in window)) return false;
  const sw = navigator.serviceWorker;
  try {
    await sw.register("/sw.js", { scope: "/" });
  } catch {
    return false;
  }
  if (!sw.controller) {
    await sw.ready;
    if (!sw.controller) {
      // clients.claim() in the worker's activate handler hands control over shortly after.
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 3000);
        sw.addEventListener("controllerchange", () => (clearTimeout(timer), resolve()), { once: true });
      });
    }
  }
  if (sw.controller) {
    sessionStorage.removeItem("fm-sw-reload");
    return true;
  }
  // A hard reload (Shift+F5) bypasses service workers for the page: reload normally, once.
  if (!sessionStorage.getItem("fm-sw-reload")) {
    sessionStorage.setItem("fm-sw-reload", "1");
    location.reload();
    return new Promise(() => {});
  }
  return false;
}

export function useLocalReady() {
  const [state, setState] = useState<"pending" | "ready" | "unsupported">("pending");
  useEffect(() => {
    let alive = true;
    void (connecting ??= connect()).then((ok) => alive && setState(ok ? "ready" : "unsupported"));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/**
 * Loads on-device data; reloads when `key` changes and, with live, after every change the
 * service worker reports (keeps the sidebar progress current like router.refresh does on the server).
 */
export function useLocalData<T>(key: string, load: () => Promise<T>, live = false) {
  const [data, setData] = useState<{ key: string; value: T }>();
  const loader = useRef(load);
  loader.current = load;

  useEffect(() => {
    let alive = true;
    const run = () => void loader.current().then((value) => alive && setData({ key, value }));
    run();
    const onMessage = (e: MessageEvent) => e.data?.type === "fm:changed" && run();
    if (live) navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => {
      alive = false;
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [key, live]);

  // Never show data of the previous key while the new one loads.
  return data?.key === key ? data.value : undefined;
}
