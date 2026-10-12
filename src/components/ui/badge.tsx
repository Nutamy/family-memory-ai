import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", {
  variants: {
    color: {
      terracotta: "bg-primary/10 text-primary",
      gold: "bg-gold/15 text-[#a76a1f] dark:text-gold",
      forest: "bg-forest/10 text-forest",
      grass: "bg-grass/15 text-grass",
      navy: "bg-foreground/10 text-foreground",
      mist: "bg-mist text-forest",
    },
  },
  defaultVariants: { color: "navy" },
});

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, color, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ color }), className)} {...props} />;
}

export type BadgeColor = NonNullable<BadgeProps["color"]>;
