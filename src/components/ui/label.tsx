import * as React from "react";

import { cn } from "@/lib/utils";

/** Label — design.md §4.2 (Body-sm 500, above the field). */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-sm font-medium text-foreground select-none",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
