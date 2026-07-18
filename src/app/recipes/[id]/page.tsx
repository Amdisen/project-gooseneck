import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeVersions, brewLogs } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { secondsToClock } from "@/lib/validation/recipe";
import { logBrew, deleteRecipe } from "../actions";

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
  if (recipe.ownerId !== user.id) redirect("/recipes");

  const [draft] = await db
    .select()
    .from(recipeVersions)
    .where(
      and(eq(recipeVersions.recipeId, id), eq(recipeVersions.isDraft, true)),
    )
    .limit(1);

  const logs = await db
    .select()
    .from(brewLogs)
    .where(eq(brewLogs.recipeId, id))
    .orderBy(desc(brewLogs.brewedAt));

  // Most recent "change next time" note, surfaced before the next brew.
  const nextTip = logs.find((l) => l.changeNext)?.changeNext;

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

      {nextTip && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <span className="font-medium">Before you brew — change next time:</span>{" "}
          {nextTip}
        </p>
      )}

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

          {(draft.beanPhotoUrl || draft.grindPhotoUrl) && (
            <section className="flex gap-3">
              {draft.beanPhotoUrl && (
                <figure className="flex flex-col gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.beanPhotoUrl}
                    alt="Bean"
                    className="h-28 w-28 rounded border border-gray-200 object-cover"
                  />
                  <figcaption className="text-xs text-gray-500">Bean</figcaption>
                </figure>
              )}
              {draft.grindPhotoUrl && (
                <figure className="flex flex-col gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.grindPhotoUrl}
                    alt="Grind"
                    className="h-28 w-28 rounded border border-gray-200 object-cover"
                  />
                  <figcaption className="text-xs text-gray-500">Grind</figcaption>
                </figure>
              )}
            </section>
          )}

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

      <section className="border-t border-gray-200 pt-4">
        <h2 className="mb-2 text-sm font-semibold">Log a brew</h2>
        <form action={logBrew.bind(null, id)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>Rating</span>
            <select
              name="rating"
              className="w-32 rounded border border-gray-300 px-3 py-2"
              defaultValue=""
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} ({n})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Tasting notes</span>
            <textarea
              name="notes"
              rows={2}
              className="rounded border border-gray-300 px-3 py-2"
              placeholder="Bright, a little sour, thin body…"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Change next time</span>
            <textarea
              name="changeNext"
              rows={2}
              className="rounded border border-gray-300 px-3 py-2"
              placeholder="Grind a touch finer; extend bloom to 0:50…"
            />
          </label>
          <button className="self-start rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            Log brew
          </button>
        </form>
      </section>

      {logs.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Brew log</h2>
          <ul className="flex flex-col gap-3">
            {logs.map((l) => (
              <li
                key={l.id}
                className="rounded border border-gray-200 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    {l.brewedAt.toISOString().slice(0, 10)}
                  </span>
                  {l.rating != null && (
                    <span className="text-amber-500">
                      {"★".repeat(l.rating)}
                      <span className="text-gray-300">
                        {"★".repeat(5 - l.rating)}
                      </span>
                    </span>
                  )}
                </div>
                {l.notes && <p className="mt-1">{l.notes}</p>}
                {l.changeNext && (
                  <p className="mt-1 text-gray-600">
                    <span className="font-medium">Change next time:</span>{" "}
                    {l.changeNext}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t border-gray-200 pt-4">
        <form action={deleteRecipe.bind(null, id)}>
          <button className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700">
            Delete recipe
          </button>
        </form>
      </section>
    </main>
  );
}
