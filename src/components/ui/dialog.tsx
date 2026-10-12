"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, title, description }: { className?: string; children: React.ReactNode; title: string; description?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          "paper-card fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6 sm:p-8",
          className,
        )}
      >
        <DialogPrimitive.Title className="pr-8 font-serif text-2xl font-semibold">{title}</DialogPrimitive.Title>
        {description && <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DialogPrimitive.Description>}
        <div className="mt-5">{children}</div>
        <DialogPrimitive.Close className="focus-ring absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Закрыть">
          <X className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
