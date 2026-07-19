import * as React from "react";

import { cn } from "@/lib/utils";

/** Input — design.md §4.2. Surface fill, hairline border, rounded-md. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-md border border-border bg-surface px-3.5 py-2 text-sm text-foreground transition-colors placeholder:text-text-muted focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
