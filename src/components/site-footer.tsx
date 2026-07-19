import Link from "next/link";
import { Container } from "@/components/container";

/** Site footer — hairline columns (design.md §5). */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <Container
        width="wide"
        className="flex flex-col justify-between gap-6 py-10 sm:flex-row"
      >
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-foreground">
            Project Gooseneck
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Record, re-brew, and share V60 pour-over recipes.
          </p>
        </div>
        <nav className="flex gap-8 text-sm">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Explore
            </span>
            <Link href="/feed" className="text-text-secondary hover:text-foreground">
              Discover
            </Link>
            <Link href="/login" className="text-text-secondary hover:text-foreground">
              Sign in
            </Link>
          </div>
        </nav>
      </Container>
    </footer>
  );
}
