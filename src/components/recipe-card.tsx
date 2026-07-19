import Link from "next/link";
import { Badge } from "@/components/ui/badge";

/**
 * Shared recipe/feed card (design.md §4.3, §8). Used by Feed, My-recipes, and
 * later Landing/Profile — build once, reference tokens only.
 *
 * Media policy = "Option A": every card has a 3:2 media tile — the bean photo
 * when present, otherwise the default recipe image. Keeps the grid uniform.
 */
export type RecipeCardProps = {
  href: string;
  title: string;
  method: string;
  photoUrl?: string | null;
  beanName?: string | null;
  dose?: number | null;
  ratio?: number | null;
  /** Feed only — recipe author's display name. */
  author?: string | null;
  /** Owner list only — shows a visibility badge instead of the author. */
  visibility?: "public" | "private";
};

export function RecipeCard({
  href,
  title,
  method,
  photoUrl,
  beanName,
  dose,
  ratio,
  author,
  visibility,
}: RecipeCardProps) {
  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-lg border border-border bg-card transition hover:border-border-strong hover:shadow-e1"
    >
      <div className="aspect-[3/2] w-full overflow-hidden border-b border-border bg-muted">
        {photoUrl ? (
          // Plain <img> to match existing recipe pages (next/image not configured).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={beanName ? `${beanName} beans` : title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          // Decorative default when a recipe has no bean photo.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/recipe-card-default.webp"
            alt=""
            aria-hidden
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Badge variant="method">{method}</Badge>
          {visibility ? (
            <Badge variant={visibility === "public" ? "solid" : "outline"}>
              {visibility === "public" ? "Public" : "Private"}
            </Badge>
          ) : null}
        </div>

        <h3 className="font-display text-lg font-medium leading-tight text-foreground">
          {title}
        </h3>

        <p className="font-mono text-sm tabular-nums text-text-secondary">
          {beanName ? <span className="font-sans">{beanName} · </span> : null}
          {dose ?? "—"}g · 1:{ratio ?? "—"}
        </p>

        {author ? (
          <p className="text-xs text-text-muted">by {author}</p>
        ) : null}
      </div>
    </Link>
  );
}
