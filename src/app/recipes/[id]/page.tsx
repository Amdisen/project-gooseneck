import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db";
import { recipes, recipeVersions, brewLogs } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { secondsToClock } from "@/lib/validation/recipe";
import { diffSnapshots } from "@/lib/recipe-diff";
import { deleteRecipe, revertDraftToVersion, setVisibility } from "../actions";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ParamGrid } from "@/components/param-grid";
import { PourTimeline } from "@/components/pour-timeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  return (
    <Container width="app" className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <PageHeader
          eyebrow="Recipe"
          title={recipe.title}
          actions={
            <>
              <Badge variant={recipe.visibility === "public" ? "solid" : "outline"}>
                {recipe.visibility === "public" ? "Public" : "Private"}
              </Badge>
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/recipes/${id}/edit`}>Edit</Link>
              </Button>
            </>
          }
        />
        {recipe.forkedFromRecipeId && (
          <p className="text-xs text-text-muted">
            Forked from{" "}
            <Link
              href={`/r/${recipe.forkedFromRecipeId}`}
              className="text-text-secondary underline hover:text-foreground"
            >
              the original
            </Link>
          </p>
        )}
      </div>

      {/* Publish / visibility */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <span className="text-sm text-text-secondary">
          {recipe.visibility === "public" ? (
            <>
              This recipe is public ·{" "}
              <Link
                href={`/r/${id}`}
                className="text-foreground underline hover:text-brand"
              >
                View public page
              </Link>
            </>
          ) : (
            "This recipe is private."
          )}
        </span>
        <form
          action={setVisibility.bind(null, id, recipe.visibility !== "public")}
        >
          <Button variant="secondary" size="sm" type="submit">
            {recipe.visibility === "public" ? "Unpublish" : "Publish"}
          </Button>
        </form>
      </Card>

      {/* Before you brew */}
      <Card className="flex flex-col gap-3 p-5">
        {nextTip && (
          <p className="text-sm text-foreground">
            <span className="font-medium">Before you brew — try:</span> {nextTip}
          </p>
        )}
        {sinceLastBrew.length > 0 && (
          <p className="text-sm text-text-secondary">
            Changed since your last brew: {sinceLastBrew.join(" · ")}
          </p>
        )}
        <Button size="lg" className="self-start" asChild>
          <Link href={`/recipes/${id}/brew`}>Brew this →</Link>
        </Button>
      </Card>

      {revertVersionId && (
        <Card className="flex flex-wrap items-center justify-between gap-3 bg-surface-2 p-4">
          <span className="flex items-center gap-2 text-sm text-text-secondary">
            <ArrowCounterClockwise size={18} aria-hidden />
            Your last brew was worse than the one before it.
          </span>
          <form action={revertDraftToVersion.bind(null, id, revertVersionId)}>
            <Button variant="secondary" size="sm" type="submit">
              Revert to previous settings
            </Button>
          </form>
        </Card>
      )}

      {draft && (
        <>
          <ParamGrid
            items={[
              { label: "Dose", value: `${draft.doseGrams}g` },
              { label: "Water", value: `${draft.waterGrams}g` },
              { label: "Ratio", value: `1:${draft.ratio ?? "—"}` },
              {
                label: "Total",
                value: draft.totalBrewSeconds
                  ? secondsToClock(draft.totalBrewSeconds)
                  : "—",
              },
            ]}
          />

          {(draft.beanName ||
            draft.grinderName ||
            draft.grindSetting ||
            draft.waterTempC != null ||
            draft.filterType) && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {draft.beanName && (
                <>
                  <dt className="text-text-muted">Bean</dt>
                  <dd className="text-foreground">
                    {[draft.beanName, draft.roaster, draft.origin, draft.roastLevel, draft.process]
                      .filter(Boolean)
                      .join(" · ")}
                  </dd>
                </>
              )}
              {(draft.grinderName || draft.grindSetting) && (
                <>
                  <dt className="text-text-muted">Grinder</dt>
                  <dd className="text-foreground">
                    {[draft.grinderName, draft.grindSetting]
                      .filter(Boolean)
                      .join(" · ")}
                  </dd>
                </>
              )}
              {draft.waterTempC != null && (
                <>
                  <dt className="text-text-muted">Water temp</dt>
                  <dd className="font-mono text-foreground">{draft.waterTempC}°C</dd>
                </>
              )}
              {draft.filterType && (
                <>
                  <dt className="text-text-muted">Filter</dt>
                  <dd className="text-foreground">{draft.filterType}</dd>
                </>
              )}
            </dl>
          )}

          {(draft.beanPhotoUrl || draft.grindPhotoUrl) && (
            <div className="flex gap-3">
              {draft.beanPhotoUrl && (
                <figure className="flex flex-col gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.beanPhotoUrl}
                    alt="Bean"
                    className="size-28 rounded-lg border border-border object-cover"
                  />
                  <figcaption className="text-xs text-text-muted">Bean</figcaption>
                </figure>
              )}
              {draft.grindPhotoUrl && (
                <figure className="flex flex-col gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.grindPhotoUrl}
                    alt="Grind"
                    className="size-28 rounded-lg border border-border object-cover"
                  />
                  <figcaption className="text-xs text-text-muted">Grind</figcaption>
                </figure>
              )}
            </div>
          )}

          <section>
            <h2 className="mb-2 font-display text-base font-medium text-foreground">
              Timeline
            </h2>
            <PourTimeline
              bloomWaterGrams={draft.bloomWaterGrams}
              bloomSeconds={draft.bloomSeconds}
              pours={draft.pours ?? []}
            />
          </section>

          {draft.techniqueNotes && (
            <section>
              <h2 className="mb-1 font-display text-base font-medium text-foreground">
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">
                {draft.techniqueNotes}
              </p>
            </section>
          )}
        </>
      )}

      {wontRepeat.length > 0 && (
        <details className="overflow-hidden rounded-lg border border-border text-sm">
          <summary className="cursor-pointer select-none px-4 py-3 font-medium text-foreground">
            Tried — didn&apos;t help ({wontRepeat.length})
          </summary>
          <ul className="flex flex-col gap-1 border-t border-border p-4 text-text-secondary">
            {wontRepeat.map((w, i) => (
              <li key={i}>✗ {w}</li>
            ))}
          </ul>
        </details>
      )}

      {logs.length > 0 && (
        <details className="overflow-hidden rounded-lg border border-border text-sm">
          <summary className="cursor-pointer select-none px-4 py-3 font-medium text-foreground">
            Brew history ({logs.length})
          </summary>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full text-left text-xs">
              <thead className="text-text-muted">
                <tr className="border-b border-border">
                  <th className="p-2.5 font-medium">Date</th>
                  <th className="p-2.5 font-medium">vs last</th>
                  <th className="p-2.5 font-medium">Rating</th>
                  <th className="p-2.5 font-medium">Recipe</th>
                  <th className="p-2.5 font-medium">Changed</th>
                  <th className="p-2.5 font-medium">Notes</th>
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
                      className="border-b border-border align-top last:border-0"
                    >
                      <td className="whitespace-nowrap p-2.5 font-mono text-text-muted">
                        {l.brewedAt.toISOString().slice(0, 10)}
                      </td>
                      <td className="whitespace-nowrap p-2.5 text-text-secondary">
                        {outcomeSymbol(l.outcome)}
                      </td>
                      <td className="whitespace-nowrap p-2.5 text-brand">
                        {l.rating != null ? "★".repeat(l.rating) : "—"}
                      </td>
                      <td className="whitespace-nowrap p-2.5 font-mono text-text-secondary">
                        {thisSnap
                          ? `${thisSnap.doseGrams}g · 1:${thisSnap.ratio ?? "—"}`
                          : "—"}
                      </td>
                      <td className="p-2.5 text-text-muted">
                        {changes.length ? changes.join(" · ") : "—"}
                      </td>
                      <td className="p-2.5 text-text-secondary">
                        {l.notes && <span>{l.notes}</span>}
                        {l.changeNext && (
                          <span className="block text-text-muted">
                            → {l.changeNext}
                          </span>
                        )}
                        {l.actualPours && l.actualPours.length > 0 && (
                          <span className="block text-text-muted">
                            ⏱ timed ·{" "}
                            {secondsToClock(
                              Math.max(
                                ...l.actualPours.map((a) => a.actualSec),
                              ),
                            )}
                          </span>
                        )}
                        {!l.notes &&
                          !l.changeNext &&
                          !l.actualPours?.length &&
                          "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <section className="border-t border-border pt-6">
        <form action={deleteRecipe.bind(null, id)}>
          <Button variant="destructive" size="sm" type="submit">
            Delete recipe
          </Button>
        </form>
      </section>
    </Container>
  );
}
