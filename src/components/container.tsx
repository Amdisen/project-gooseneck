import type { ReactNode } from "react";

// Width tiers from design.md §5 (capped + centered, never full-bleed).
const widths = {
  wide: "max-w-[1200px]", // app shell, feed grid, landing
  app: "max-w-[960px]", // recipe detail, library
  prose: "max-w-[680px]", // forms, single-column reading
  card: "max-w-[400px]", // auth
} as const;

export function Container({
  width = "prose",
  className = "",
  children,
}: {
  width?: keyof typeof widths;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto w-full ${widths[width]} px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}
