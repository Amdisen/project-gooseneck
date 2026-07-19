import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Field — a label that wraps its control (implicit association, no id needed),
 * design.md §4.2. Label above (Body-sm 500), control below.
 */
function Field({
  label,
  className,
  children,
}: {
  label: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export { Field };
