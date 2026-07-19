import Link from "next/link";
import { getUser } from "@/lib/auth";
import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

/** Persistent top navigation shown on every page. Adapts to auth state. */
export async function SiteHeader() {
  const user = await getUser();
  const link = "text-muted-foreground hover:text-foreground whitespace-nowrap";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <Container
        width="wide"
        className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-3"
      >
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-foreground"
        >
          Project Gooseneck
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/feed" className={link}>
            Discover
          </Link>
          {user && (
            <>
              <Link href="/recipes" className={link}>
                My recipes
              </Link>
              <Link href="/library" className={link}>
                Library
              </Link>
              <Link href="/account" className={link}>
                Account
              </Link>
            </>
          )}
          <ThemeToggle />
          <Button size="sm" asChild>
            <Link href={user ? "/recipes/new" : "/login"}>
              {user ? "+ New" : "Sign in"}
            </Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
