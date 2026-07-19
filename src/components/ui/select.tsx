import * as React from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";

/**
 * Select — styled native <select> with a Phosphor CaretDown (design.md §4.2).
 * Native keeps it server-render-safe and fully accessible; a Radix Select can
 * replace this later if we need richer option rendering.
 */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "flex h-11 w-full appearance-none rounded-md border border-border bg-surface pl-3.5 pr-9 text-sm text-foreground transition-colors focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <CaretDown
        size={16}
        weight="bold"
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}

export { Select };
