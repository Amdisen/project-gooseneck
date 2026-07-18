import Link from "next/link";
import { getUser } from "@/lib/auth";

/**
 * Persistent top navigation shown on every page. Adapts to auth state.
 * (The polished mobile bottom-tab version comes with the design pass.)
 */
export async function SiteHeader() {
  const user = await getUser();

  const link = "text-gray-600 hover:text-black whitespace-nowrap";

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Project Gooseneck
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/feed" className={link}>
            Discover
          </Link>
          {user ? (
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
              <Link
                href="/recipes/new"
                className="rounded bg-gray-900 px-3 py-1.5 font-medium text-white"
              >
                + New
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded bg-gray-900 px-3 py-1.5 font-medium text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
