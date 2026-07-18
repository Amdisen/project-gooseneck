import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeVersions, brewLogs } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { secondsToClock } from "@/lib/validation/recipe";
import { diffSnapshots } from "@/lib/recipe-diff";
import { deleteRecipe, revertDraftToVersion } from "../actions";

const outcomeSymbol = (o: string | null) =>
  o === "better" ? "▲ better" : o === "worse" ? "▼ worse" : o === "same" ? "= same" : "—";

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

  const versionIds = logs
    .map((l) => l.recipeVersionId)
    .filter((v): v is string => v != null);
  const snaps = versionIds.length
    ? await db
        .select()
        .from(recipeVersions)
        .where(inArray(recipeVersions.id, versionIds))
    : [];
  const snapById = new Map(snaps.map((s) => [s.id, s]));

  // Latest "try next" note is the only open suggestion.
  const nextTip = logs[0]?.changeNext ?? null;

  // How the current recipe differs from the most recent brew.
  const lastBrewSnap = logs[0]?.recipeVersionId
    ? snapById.get(logs[0].recipeVersionId)
    : undefined;
  const sinceLastBrew =
    draft && lastBrewSnap ? diffSnapshots(lastBrewSnap, draft) : [];

  // Offer to undo if the most recent brew was worse than the one before it.
  const revertVersionId =
    logs[0]?.outcome === "worse" ? (logs[1]?.recipeVersionId ?? null) : null;

  // "Won't repeat" = the change that made a brew worse.
  const wontRepeat: string[] = [];
  logs.forEach((l, i) => {
    if (l.outcome !== "worse") return;
    const thisSnap = l.recipeVersionId ? snapById.get(l.recipeVersionId) : undefined;
    const prevSnap = logs[i + 1]?.recipeVersionId
      ? snapById.get(logs[i + 1].recipeVersionId!)
      : undefined;
    if (thisSnap && prevSnap) {
      const d = diffSnapshots(prevSnap, thisSnap);
      if (d.length) wontRepeat.push(d.join(" · "));
    }
  });

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

      {/* Before you brew */}
      <section className="flex flex-col gap-3 rounded border border-gray-200 p-4">
        {nextTip && (
          <p className="text-sm">
            <span className="font-medium">Before you brew — try:</span> {nextTip}
          </p>
        )}
        {sinceLastBrew.length > 0 && (
          <p className="text-sm text-gray-500">
            Changed since your last brew: {sinceLastBrew.join(" · ")}
          </p>
        )}
        <Link
          href={`/recipes/${id}/brew`}
          className="self-start rounded bg-gray-900 px-5 py-2.5 font-medium text-white"
        >
          Brew this →
        </Link>
      </section>

      {revertVersionId && (
        <div className="flex flex-col gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <span>Your last brew was worse than the one before it.</span>
          <form action={revertDraftToVersion.bind(null, id, revertVersionId)}>
            <button className="rounded border border-amber-400 px-3 py-1.5 font-medium">
              Revert to previous settings
            </button>
          </form>
        </div>
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

      {wontRepeat.length > 0 && (
        <details className="rounded border border-gray-200 text-sm">
          <summary className="cursor-pointer select-none px-3 py-2 font-medium text-gray-700">
            Tried — didn&apos;t help ({wontRepeat.length})
          </summary>
          <ul className="flex flex-col gap-1 border-t border-gray-200 p-3 text-gray-500">
            {wontRepeat.map((w, i) => (
              <li key={i}>✗ {w}</li>
            ))}
          </ul>
        </details>
      )}

      {logs.length > 0 && (
        <details className="rounded border border-gray-200 text-sm">
          <summary className="cursor-pointer select-none px-3 py-2 font-medium text-gray-700">
            Brew history ({logs.length})
          </summary>
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr className="border-b border-gray-200">
                  <th className="p-2 font-medium">Date</th>
                  <th className="p-2 font-medium">vs last</th>
                  <th className="p-2 font-medium">Rating</th>
                  <th className="p-2 font-medium">Recipe</th>
                  <th className="p-2 font-medium">Changed</th>
                  <th className="p-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => {
                  const thisSnap = l.recipeVersionId
                    ? snapById.get(l.recipeVersionId)
                    : undefined;
                  const prevSnap = logs[i + 1]?.recipeVersionId
                    ? snapById.get(logs[i + 1].recipeVersionId!)
                    : undefined;
                  const changes =
                    thisSnap && prevSnap
                      ? diffSnapshots(prevSnap, thisSnap)
                      : [];
                  return (
                    <tr
                      key={l.id}
                      className="border-b border-gray-100 align-top last:border-0"
                    >
                      <td className="whitespace-nowrap p-2 text-gray-500">
                        {l.brewedAt.toISOString().slice(0, 10)}
                      </td>
                      <td className="whitespace-nowrap p-2 text-gray-600">
                        {outcomeSymbol(l.outcome)}
                      </td>
                      <td className="whitespace-nowrap p-2 text-amber-500">
                        {l.rating != null ? "★".repeat(l.rating) : "—"}
                      </td>
                      <td className="whitespace-nowrap p-2 text-gray-600">
                        {thisSnap
                          ? `${thisSnap.doseGrams}g · 1:${thisSnap.ratio ?? "—"}`
                          : "—"}
                      </td>
                      <td className="p-2 text-gray-500">
                        {changes.length ? changes.join(" · ") : "—"}
                      </td>
                      <td className="p-2">
                        {l.notes && <span>{l.notes}</span>}
                        {l.changeNext && (
                          <span className="block text-gray-500">
                            → {l.changeNext}
                          </span>
                        )}
                        {!l.notes && !l.changeNext && "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
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
