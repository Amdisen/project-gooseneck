import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeVersions } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { secondsToClock } from "@/lib/validation/recipe";
import { saveVersion, deleteRecipe } from "../actions";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);
  if (!recipe) notFound();
  // Recipes are private until Phase 3 opens up public viewing.
  if (recipe.ownerId !== user.id) redirect("/recipes");

  const [draft] = await db
    .select()
    .from(recipeVersions)
    .where(
      and(eq(recipeVersions.recipeId, id), eq(recipeVersions.isDraft, true)),
    )
    .limit(1);

  const saved = await db
    .select()
    .from(recipeVersions)
    .where(
      and(eq(recipeVersions.recipeId, id), eq(recipeVersions.isDraft, false)),
    )
    .orderBy(desc(recipeVersions.versionNumber));

  // Reconstruct the cumulative timeline for display.
  const bloomWater = draft?.bloomWaterGrams ?? 0;
  let running = bloomWater;
  const steps = (draft?.pours ?? []).map((p) => {
    running += p.waterGrams;
    return { at: p.stepEndAtSec, add: p.waterGrams, total: running };
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div>
        <Link href="/recipes" className="text-sm text-gray-500 underline">
          ← My recipes
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{recipe.title}</h1>
          <Link
            href={`/recipes/${id}/edit`}
            className="shrink-0 rounded border border-gray-300 px-3 py-1.5 text-sm font-medium"
          >
            Edit
          </Link>
        </div>
        {draft && (
          <p className="mt-1 text-sm text-gray-500">
            {draft.doseGrams}g in · {draft.waterGrams}g water · ratio 1:
            {draft.ratio ?? "—"} ·{" "}
            {draft.totalBrewSeconds
              ? secondsToClock(draft.totalBrewSeconds)
              : "—"}{" "}
            total
          </p>
        )}
      </div>

      {draft && (
        <>
          <section className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {draft.beanName && (
              <>
                <dt className="text-gray-500">Bean</dt>
                <dd>
                  {draft.beanName}
                  {draft.roaster ? ` · ${draft.roaster}` : ""}
                  {draft.origin ? ` · ${draft.origin}` : ""}
                  {draft.roastLevel ? ` · ${draft.roastLevel}` : ""}
                </dd>
              </>
            )}
            {(draft.grinderName || draft.grindSetting) && (
              <>
                <dt className="text-gray-500">Grinder</dt>
                <dd>
                  {[draft.grinderName, draft.grindSetting]
                    .filter(Boolean)
                    .join(" · ")}
                </dd>
              </>
            )}
            {draft.waterTempC != null && (
              <>
                <dt className="text-gray-500">Water temp</dt>
                <dd>{draft.waterTempC}°C</dd>
              </>
            )}
            {draft.filterType && (
              <>
                <dt className="text-gray-500">Filter</dt>
                <dd>{draft.filterType}</dd>
              </>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">Timeline</h2>
            <ol className="flex flex-col divide-y divide-gray-200 rounded border border-gray-200 text-sm">
              <li className="flex items-center justify-between p-2.5">
                <span>Bloom · {bloomWater}g</span>
                <span className="text-gray-500">
                  until {secondsToClock(draft.bloomSeconds ?? 0)}
                </span>
              </li>
              {steps.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between p-2.5"
                >
                  <span>
                    Pour {i + 1} · up to {s.total}g{" "}
                    <span className="text-gray-400">(+{s.add}g)</span>
                  </span>
                  <span className="text-gray-500">by {secondsToClock(s.at)}</span>
                </li>
              ))}
            </ol>
          </section>

          {draft.techniqueNotes && (
            <section>
              <h2 className="mb-1 text-sm font-semibold">Notes</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {draft.techniqueNotes}
              </p>
            </section>
          )}
        </>
      )}

      <section className="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
        <form action={saveVersion.bind(null, id)}>
          <button className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            Save version
          </button>
        </form>
        <form action={deleteRecipe.bind(null, id)}>
          <button className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700">
            Delete recipe
          </button>
        </form>
      </section>

      {saved.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Saved versions</h2>
          <ul className="flex flex-col divide-y divide-gray-200 rounded border border-gray-200 text-sm">
            {saved.map((v) => (
              <li key={v.id} className="flex items-center justify-between p-2.5">
                <span>Version {v.versionNumber}</span>
                <span className="text-gray-500">
                  {v.doseGrams}g · 1:{v.ratio ?? "—"} ·{" "}
                  {v.totalBrewSeconds ? secondsToClock(v.totalBrewSeconds) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
