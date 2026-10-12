import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { SaveState } from "@/lib/use-autosave";

export function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground" aria-live="polite">
      {state === "saving" || state === "pending" ? (
        <>
          <Loader2 className="size-3.5 animate-spin" /> Сохраняю
        </>
      ) : state === "saved" ? (
        <>
          <Check className="size-3.5 text-grass" /> Сохранено
        </>
      ) : (
        <>
          <AlertCircle className="size-3.5 text-primary" /> Не сохранено — повторю
        </>
      )}
    </span>
  );
}
