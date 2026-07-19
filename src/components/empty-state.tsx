import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Centered empty state (design.md §4.9): icon + one-line message + optional
 * primary action. Shared by Feed, My-recipes, and other list surfaces.
 */
export function EmptyState({
  icon,
  message,
  action,
}: {
  icon?: ReactNode;
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-6 py-16 text-center">
      {icon ? <div className="text-text-muted">{icon}</div> : null}
      <p className="max-w-sm text-sm text-text-secondary">{message}</p>
      {action ? (
        <Button size="sm" asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
