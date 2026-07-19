import type { ReactNode } from "react";

/**
 * Page header — uppercase eyebrow + title (+ optional subtitle) with an optional
 * right-aligned actions slot. Matches ElevenLabs' settings header pattern.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-semibold text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
