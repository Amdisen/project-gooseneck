import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";

export default async function RecipesPage() {
  const user = await requireUser();

  const rows = await db
    .select()
    .from(recipes)
    .where(eq(recipes.ownerId, user.id))
    .orderBy(desc(recipes.updatedAt));

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My recipes</h1>
        <Link
          href="/recipes/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          + New recipe
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">
          No recipes yet. Create your first V60 recipe to get started.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-200 rounded border border-gray-200">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/recipes/${r.id}`}
                className="flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <span className="font-medium">{r.title}</span>
                <span className="text-xs uppercase text-gray-400">
                  {r.visibility}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 flex gap-4">
        <Link href="/feed" className="text-sm text-gray-500 underline">
          Discover
        </Link>
        <Link href="/library" className="text-sm text-gray-500 underline">
          Library
        </Link>
        <Link href="/account" className="text-sm text-gray-500 underline">
          Account
        </Link>
      </p>
    </main>
  );
}
