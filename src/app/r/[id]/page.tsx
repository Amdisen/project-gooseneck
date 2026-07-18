import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  recipes,
  recipeVersions,
  brewLogs,
  profiles,
  brewers,
  comments,
} from "@/lib/db/schema";
import { secondsToClock } from "@/lib/validation/recipe";
import { getUser } from "@/lib/auth";
import { forkRecipe } from "@/app/recipes/actions";
import { addComment, deleteComment, reportComment } from "../actions";

export default async function PublicRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);
  if (!recipe || recipe.visibility !== "public") notFound();

  const [author] = await db
    .select({ name: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, recipe.ownerId))
    .limit(1);

  const [draft] = await db
    .select()
    .from(recipeVersions)
    .where(
      and(eq(recipeVersions.recipeId, id), eq(recipeVersions.isDraft, true)),
    )
    .limit(1);

  const brewer = recipe.brewerId
    ? (
        await db
          .select({ name: brewers.name })
          .from(brewers)
          .where(eq(brewers.id, recipe.brewerId))
          .limit(1)
      )[0]
    : undefined;

  // Public brew context = ratings + tasting notes only (no iteration internals).
  const logs = await db
    .select({
      id: brewLogs.id,
      rating: brewLogs.rating,
      notes: brewLogs.notes,
      brewedAt: brewLogs.brewedAt,
    })
    .from(brewLogs)
    .where(eq(brewLogs.recipeId, id))
    .orderBy(desc(brewLogs.brewedAt));
  const publicLogs = logs.filter((l) => l.rating != null || l.notes);
  const rated = logs.filter((l) => l.rating != null);
  const avg =
    rated.length > 0
      ? Math.round(
          (rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length) * 10,
        ) / 10
      : null;

  const commentRows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      userId: comments.userId,
      author: profiles.displayName,
    })
    .from(comments)
    .innerJoin(profiles, eq(profiles.id, comments.userId))
    .where(and(eq(comments.recipeId, id), isNull(comments.hiddenAt)))
    .orderBy(desc(comments.createdAt));

  const bloomWater = draft?.bloomWaterGrams ?? 0;
  let running = bloomWater;
  const steps = (draft?.pours ?? []).map((p) => {
    running += p.waterGrams;
    return { at: p.stepEndAtSec, add: p.waterGrams, total: running };
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div>
        <Link href="/feed" className="text-sm text-gray-500 underline">
          ← Browse recipes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{recipe.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          by {author?.name ?? "a Gooseneck user"}
          <span className="ml-2 uppercase text-gray-400">{recipe.method}</span>
          {avg != null && (
            <span className="ml-2 text-amber-500">
              ★ {avg}{" "}
              <span className="text-gray-400">({rated.length})</span>
            </span>
          )}
        </p>
      </div>

      <section className="flex items-center gap-3">
        {user ? (
          <form action={forkRecipe.bind(null, id)}>
            <button className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
              Fork this recipe
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            Sign in to fork
          </Link>
        )}
        <span className="text-xs text-gray-500">
          Saves a private copy to your recipes to tweak.
        </span>
      </section>

      {draft && (
        <>
          <section className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-gray-500">Recipe</dt>
            <dd>
              {draft.doseGrams}g in · {draft.waterGrams}g water · ratio 1:
              {draft.ratio ?? "—"} ·{" "}
              {draft.totalBrewSeconds
                ? secondsToClock(draft.totalBrewSeconds)
                : "—"}{" "}
              total
            </dd>
            {draft.beanName && (
              <>
                <dt className="text-gray-500">Bean</dt>
                <dd>
                  {draft.beanName}
                  {draft.roaster ? ` · ${draft.roaster}` : ""}
                  {draft.origin ? ` · ${draft.origin}` : ""}
                  {draft.roastLevel ? ` · ${draft.roastLevel}` : ""}
                  {draft.process ? ` · ${draft.process}` : ""}
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
            {brewer && (
              <>
                <dt className="text-gray-500">Brewer</dt>
                <dd>{brewer.name}</dd>
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.beanPhotoUrl}
                  alt="Bean"
                  className="h-28 w-28 rounded border border-gray-200 object-cover"
                />
              )}
              {draft.grindPhotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.grindPhotoUrl}
                  alt="Grind"
                  className="h-28 w-28 rounded border border-gray-200 object-cover"
                />
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
                <li key={i} className="flex items-center justify-between p-2.5">
                  <span>
                    Pour {i + 1} · up to {s.total}g{" "}
                    <span className="text-gray-400">(+{s.add}g)</span>
                  </span>
                  <span className="text-gray-500">
                    by {secondsToClock(s.at)}
                  </span>
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

      {publicLogs.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">
            The maker&apos;s brews
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {publicLogs.map((l) => (
              <li key={l.id} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    {l.brewedAt.toISOString().slice(0, 10)}
                  </span>
                  {l.rating != null && (
                    <span className="text-amber-500">
                      {"★".repeat(l.rating)}
                    </span>
                  )}
                </div>
                {l.notes && <p className="mt-1">{l.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">
          Comments ({commentRows.length})
        </h2>
        {user ? (
          <form
            action={addComment.bind(null, id)}
            className="mb-3 flex flex-col gap-2"
          >
            <textarea
              name="body"
              required
              maxLength={1000}
              rows={2}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Share how it went, or a tip…"
            />
            <button className="self-start rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
              Post comment
            </button>
          </form>
        ) : (
          <p className="mb-3 text-sm text-gray-500">
            <Link href="/login" className="underline">
              Sign in
            </Link>{" "}
            to comment.
          </p>
        )}
        {commentRows.length === 0 ? (
          <p className="text-sm text-gray-400">No comments yet.</p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {commentRows.map((c) => (
              <li key={c.id} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{c.author ?? "A Gooseneck user"}</span>
                  <span>{c.createdAt.toISOString().slice(0, 10)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
                <div className="mt-1 flex gap-3 text-xs">
                  {(user?.id === c.userId || user?.id === recipe.ownerId) && (
                    <form action={deleteComment.bind(null, id, c.id)}>
                      <button className="text-red-600 underline">Delete</button>
                    </form>
                  )}
                  {user && user.id !== c.userId && (
                    <form action={reportComment.bind(null, id, c.id)}>
                      <button className="text-gray-400 underline">
                        Report
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
