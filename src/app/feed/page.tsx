import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeVersions, profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth";

export default async function FeedPage() {
  const user = await getUser();

  const rows = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      method: recipes.method,
      author: profiles.displayName,
      dose: recipeVersions.doseGrams,
      ratio: recipeVersions.ratio,
      beanName: recipeVersions.beanName,
      roaster: recipeVersions.roaster,
    })
    .from(recipes)
    .innerJoin(
      recipeVersions,
      and(
        eq(recipeVersions.recipeId, recipes.id),
        eq(recipeVersions.isDraft, true),
      ),
    )
    .innerJoin(profiles, eq(profiles.id, recipes.ownerId))
    .where(eq(recipes.visibility, "public"))
    .orderBy(desc(recipes.publishedAt))
    .limit(50);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Discover</h1>
        <Link
          href={user ? "/recipes" : "/login"}
          className="text-sm text-gray-500 underline"
        >
          {user ? "My recipes" : "Sign in"}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">
          No public recipes yet. Publish one from your recipe page to share it
          here.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/r/${r.id}`}
                className="flex flex-col gap-1 rounded border border-gray-200 p-4 hover:border-gray-400"
              >
                <span className="font-medium">{r.title}</span>
                <span className="text-sm text-gray-500">
                  {r.beanName ? `${r.beanName} · ` : ""}
                  {r.dose}g · 1:{r.ratio ?? "—"}
                  <span className="ml-2 uppercase text-gray-400">
                    {r.method}
                  </span>
                </span>
                <span className="text-xs text-gray-400">
                  by {r.author ?? "a Gooseneck user"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
