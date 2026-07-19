import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Settings/list pattern from ElevenLabs (design.md §4.3): a hairline-bordered
 * container of rows, each with a label + optional description on the left and
 * trailing actions on the right, divided by hairlines.
 */
export function List({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <ul
      className={cn(
        "divide-y divide-border overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {children}
    </ul>
  );
}

export function ListRow({
  label,
  description,
  children,
}: {
  label: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3.5">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description ? (
          <div className="mt-0.5 text-sm text-text-secondary">{description}</div>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      ) : null}
    </li>
  );
}
