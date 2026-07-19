import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/** Card — design.md §4.3. Surface, hairline, rounded-lg. `asChild` to render as
 *  another element (e.g. an <li> inside a list) while keeping the card styling. */
function Card({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      data-slot="card"
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Card };
