"use client";

import { useEffect } from "react";

/** Remembers the last opened section for "Продолжить заполнение". */
export function TrackSection({ personId, slug }: { personId: string; slug: string }) {
  useEffect(() => {
    void fetch(`/api/persons/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastSection: slug }),
    });
  }, [personId, slug]);
  return null;
}
