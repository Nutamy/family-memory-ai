import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-2xl border border-border bg-background/60 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary/50 focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(field, "h-12", className)} {...props} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(field, "min-h-[140px] resize-y py-3 leading-relaxed", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-semibold text-foreground/80", className)} {...props} />;
}
