import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  recipes,
  recipeVersions,
  brewLogs,
  type RecipeVersion,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { secondsToClock } from "@/lib/validation/recipe";
import { logBrew, deleteRecipe } from "../actions";

/** Human-readable list of what changed between two param snapshots. */
function diffSnapshots(
  prev: RecipeVersion,
  curr: RecipeVersion,
): string[] {
  const out: string[] = [];
  const cmp = (
    label: string,
    a: unknown,
    b: unknown,
    fmt: (x: never) => string = (x) => String(x),
  ) => {
    const av = a ?? null;
    const bv = b ?? null;
    if (av !== bv) {
      out.push(
        `${label} ${av === null ? "—" : fmt(av as never)} → ${
          bv === null ? "—" : fmt(bv as never)
        }`,
      );
    }
  };
  cmp("dose", prev.doseGrams, curr.doseGrams, (x: number) => `${x}g`);
  cmp("grind", prev.grindSetting, curr.grindSetting);
  cmp("water", prev.waterGrams, curr.waterGrams, (x: number) => `${x}g`);
  cmp("temp", prev.waterTempC, curr.waterTempC, (x: number) => `${x}°C`);
  cmp(
    "bloom water",
    prev.bloomWaterGrams,
    curr.bloomWaterGrams,
    (x: number) => `${x}g`,
  );
  cmp(
    "bloom time",
    prev.bloomSeconds,
    curr.bloomSeconds,
    (x: number) => secondsToClock(x),
  );
  cmp("ratio", prev.ratio, curr.ratio, (x: number) => `1:${x}`);
  cmp("bean", prev.beanName, curr.beanName);
  cmp("grinder", prev.grinderName, curr.grinderName);
  cmp("filter", prev.filterType, curr.filterType);
  if (JSON.stringify(prev.pours) !== JSON.stringify(curr.pours)) {
    out.push(
      `pour schedule (${prev.pours?.length ?? 0} → ${curr.pours?.length ?? 0} pours)`,
    );
  }
  return out;
}

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

  // Load the param snapshots tied to those brews.
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

  const nextTip = logs.find((l) => l.changeNext)?.changeNext;

  // How does the current recipe differ from the most recent brew?
  const lastBrewSnap = logs[0]?.recipeVersionId
    ? snapById.get(logs[0].recipeVersionId)
    : undefined;
  const sinceLastBrew =
    draft && lastBrewSnap ? diffSnapshots(lastBrewSnap, draft) : [];

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

      {sinceLastBrew.length > 0 && (
        <div className="rounded border border-gray-300 bg-gray-50 p-3 text-sm">
          <span className="font-medium">Changed since your last brew:</span>{" "}
          {sinceLastBrew.join(" · ")}
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
        <details className="rounded border border-gray-200 text-sm">
          <summary className="cursor-pointer select-none px-3 py-2 font-medium text-gray-700">
            Brew history ({logs.length})
          </summary>
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr className="border-b border-gray-200">
                  <th className="p-2 font-medium">Date</th>
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
                  const prevLog = logs[i + 1];
                  const prevSnap = prevLog?.recipeVersionId
                    ? snapById.get(prevLog.recipeVersionId)
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
