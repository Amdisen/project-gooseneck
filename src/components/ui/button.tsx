import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * Button — design.md §4.1. Rectangular (rounded-md), hairline, monochrome.
 * Primary = solid foreground; secondary = surface + strong hairline; ghost;
 * destructive = danger outline; link = underline (brand on hover, §3.3).
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:border-transparent disabled:bg-transparent disabled:text-text-muted [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-text-secondary",
        secondary:
          "border border-border-strong bg-surface text-foreground hover:border-text-muted hover:bg-surface-2",
        ghost: "text-text-secondary hover:bg-surface-2 hover:text-foreground",
        destructive: "border border-danger text-danger hover:bg-danger/10",
        link: "text-foreground underline-offset-4 hover:text-brand hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-3.5",
        lg: "h-11 px-4 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
