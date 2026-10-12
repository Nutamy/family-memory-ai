"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

/**
 * Debounced autosave. `schedule(payload)` queues a save; `flush()` saves immediately
 * (used on blur and before navigation). The latest payload always wins.
 */
export function useAutosave<T>(save: (payload: T) => Promise<void>, delay = 900) {
  const [state, setState] = useState<SaveState>("idle");
  const pending = useRef<T | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const payload = pending.current;
    if (payload === null) return;
    pending.current = null;
    setState("saving");
    try {
      await saveRef.current(payload);
      setState(pending.current === null ? "saved" : "pending");
    } catch {
      setState("error");
      // Re-queue so the next edit or blur retries.
      pending.current ??= payload;
    }
  }, []);

  const schedule = useCallback(
    (payload: T) => {
      pending.current = payload;
      setState("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  useEffect(() => {
    const onHide = () => {
      if (pending.current !== null) void flush();
    };
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
      onHide();
    };
  }, [flush]);

  return { state, schedule, flush };
}
