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
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { ParamGrid } from "@/components/param-grid";
import { PourTimeline } from "@/components/pour-timeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <Container width="app" className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-3">
        <PageHeader
          eyebrow="Public recipe"
          title={recipe.title}
          actions={
            user ? (
              <form action={forkRecipe.bind(null, id)}>
                <Button type="submit">Fork this recipe</Button>
              </form>
            ) : (
              <Button asChild>
                <Link href="/login">Sign in to fork</Link>
              </Button>
            )
          }
        />
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-text-secondary">
          <span>by {author?.name ?? "a Gooseneck user"}</span>
          <Badge variant="method">{recipe.method}</Badge>
          {avg != null && (
            <span className="font-mono text-brand">
              ★ {avg}{" "}
              <span className="text-text-muted">({rated.length})</span>
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted">
          Forking saves a private copy to your recipes to tweak.
        </p>
      </div>

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
            brewer ||
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
              {brewer && (
                <>
                  <dt className="text-text-muted">Brewer</dt>
                  <dd className="text-foreground">{brewer.name}</dd>
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.beanPhotoUrl}
                  alt="Bean"
                  className="size-28 rounded-lg border border-border object-cover"
                />
              )}
              {draft.grindPhotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.grindPhotoUrl}
                  alt="Grind"
                  className="size-28 rounded-lg border border-border object-cover"
                />
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

      {publicLogs.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-base font-medium text-foreground">
            The maker&apos;s brews
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {publicLogs.map((l) => (
              <Card key={l.id} className="p-3" asChild>
                <li>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-text-muted">
                      {l.brewedAt.toISOString().slice(0, 10)}
                    </span>
                    {l.rating != null && (
                      <span className="text-brand">{"★".repeat(l.rating)}</span>
                    )}
                  </div>
                  {l.notes && <p className="mt-1 text-foreground">{l.notes}</p>}
                </li>
              </Card>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-display text-base font-medium text-foreground">
          Comments ({commentRows.length})
        </h2>
        {user ? (
          <form
            action={addComment.bind(null, id)}
            className="mb-4 flex flex-col gap-2"
          >
            <Textarea
              name="body"
              required
              maxLength={1000}
              rows={2}
              placeholder="Share how it went, or a tip…"
            />
            <Button type="submit" size="sm" className="self-start">
              Post comment
            </Button>
          </form>
        ) : (
          <p className="mb-4 text-sm text-text-secondary">
            <Link href="/login" className="underline hover:text-foreground">
              Sign in
            </Link>{" "}
            to comment.
          </p>
        )}
        {commentRows.length === 0 ? (
          <p className="text-sm text-text-muted">No comments yet.</p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {commentRows.map((c) => (
              <Card key={c.id} className="p-3" asChild>
                <li>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{c.author ?? "A Gooseneck user"}</span>
                    <span className="font-mono">
                      {c.createdAt.toISOString().slice(0, 10)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-foreground">
                    {c.body}
                  </p>
                  <div className="mt-2 flex gap-3 text-xs">
                    {(user?.id === c.userId || user?.id === recipe.ownerId) && (
                      <form action={deleteComment.bind(null, id, c.id)}>
                        <button className="text-danger underline">Delete</button>
                      </form>
                    )}
                    {user && user.id !== c.userId && (
                      <form action={reportComment.bind(null, id, c.id)}>
                        <button className="text-text-muted underline hover:text-foreground">
                          Report
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
