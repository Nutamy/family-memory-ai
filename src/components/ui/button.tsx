import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_rgb(var(--primary)/.7)] hover:brightness-110",
        secondary: "bg-gold text-gold-foreground shadow-[0_8px_20px_-8px_rgb(var(--gold)/.7)] hover:brightness-105",
        outline: "border border-foreground/15 bg-card/60 text-foreground hover:border-primary/40 hover:text-primary",
        ghost: "text-foreground/80 hover:bg-muted hover:text-foreground",
        soft: "bg-mist text-forest hover:brightness-95",
        danger: "text-primary hover:bg-primary/10",
        link: "rounded-none px-0 text-foreground/70 underline-offset-4 hover:text-primary",
      },
      size: {
        sm: "h-8 px-3.5 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-14 px-8 font-serif text-lg font-medium",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Adds the signature "→" arrow from the UI kit. */
  arrow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, arrow, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {asChild ? (
          children
        ) : (
          <>
            {children}
            {arrow && <ArrowRight aria-hidden />}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
