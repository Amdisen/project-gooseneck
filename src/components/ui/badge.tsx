import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge / tag / chip — design.md §4.4. Small rounded-rectangle (rounded-sm),
 * hairline. Not a pill. `solid` = filled foreground (e.g. Public visibility);
 * `outline` = hairline (e.g. Private); `method` = uppercase meta chip.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        outline: "border border-border text-text-secondary",
        solid: "bg-primary text-primary-foreground",
        method:
          "border border-border uppercase tracking-wide text-text-secondary",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
