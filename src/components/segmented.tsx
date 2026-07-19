import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Segmented control (design.md §4.6, ElevenLabs "Explore | My Voices").
 * Link-based so it works in Server Components via a URL param — the active
 * segment lifts to a surface fill inside a surface-2 track.
 */
export function Segmented({
  items,
}: {
  items: { label: string; href: string; active: boolean }[];
}) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 p-1"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          role="tab"
          aria-selected={item.active}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            item.active
              ? "bg-surface text-foreground shadow-e1"
              : "text-text-secondary hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
