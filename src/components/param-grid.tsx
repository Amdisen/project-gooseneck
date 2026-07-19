import type { ReactNode } from "react";

/**
 * Hairline-divided stat tiles (ElevenLabs dashboard pattern; design.md §4.3).
 * Numbers render in JetBrains Mono so the recipe reads like an instrument panel.
 * The gap-px + bg-border technique draws crisp hairlines between tiles at any
 * column count.
 */
export function ParamGrid({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1 bg-card p-4">
          <dt className="text-xs uppercase tracking-wide text-text-muted">
            {item.label}
          </dt>
          <dd className="font-mono text-lg text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
