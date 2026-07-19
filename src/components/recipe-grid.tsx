import type { ReactNode } from "react";

/**
 * Responsive card grid for recipe/feed cards (design.md §5 discovery feed:
 * 1 col mobile / 2 md / 3 lg). Cards stretch to equal height per row (default
 * grid alignment) since every card now carries a media tile (Option A).
 */
export function RecipeGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {children}
    </ul>
  );
}
