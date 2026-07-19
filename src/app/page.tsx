import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import {
  ListNumbers,
  Timer,
  ClockCounterClockwise,
  Books,
  ShareNetwork,
  Drop,
} from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db";
import { recipes, recipeVersions, profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeGrid } from "@/components/recipe-grid";
import { SiteFooter } from "@/components/site-footer";

const STEPS = [
  {
    title: "Record",
    body: "Capture the bean, grind setting, dose, water, and every pour with its timing.",
  },
  {
    title: "Brew",
    body: "Follow the guided timer, phone in hand — it counts you into each pour and keeps the screen awake.",
  },
  {
    title: "Iterate",
    body: "Log how it tasted, change one thing, keep what's better — then share it to the feed.",
  },
];

const FEATURES = [
  { icon: ListNumbers, title: "Structured timeline", body: "Bloom and every pour as target water + time — not a wall of notes." },
  { icon: Timer, title: "Guided brew timer", body: "Timestamp-accurate countdown, wake-lock, and a cue on every pour." },
  { icon: ClockCounterClockwise, title: "Logbook loop", body: "Better / same / worse, auto-snapshots, and one-tap revert when a change flops." },
  { icon: Books, title: "Reusable library", body: "Save coffees, grinders, and brewers once; pre-fill every new recipe." },
  { icon: Drop, title: "Real numbers", body: "Dose, ratio, water, temp, and time in a clean mono readout." },
  { icon: ShareNetwork, title: "Share & fork", body: "Publish to the feed; anyone can fork a recipe and re-dial it for their beans." },
];

export default async function Home() {
  const user = await getUser();

  const samples = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      method: recipes.method,
      author: profiles.displayName,
      dose: recipeVersions.doseGrams,
      ratio: recipeVersions.ratio,
      beanName: recipeVersions.beanName,
      photoUrl: recipeVersions.beanPhotoUrl,
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
    .limit(3);

  return (
    <>
      {/* Hero */}
      <Container width="wide" className="py-20 sm:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">
            V60 pour-over
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none tracking-tight text-foreground sm:text-6xl">
            Brew it once.
            <br />
            Re-brew it exactly.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-text-secondary">
            Gooseneck records every variable of your pour-over — bean, grind,
            dose, water, and each pour — so a great cup is repeatable, tweakable,
            and shareable.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <>
                <Button size="lg" asChild>
                  <Link href="/recipes">My recipes</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/recipes/new">New recipe</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/login">Get started</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/feed">Discover recipes</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </Container>

      {/* How it works */}
      <Container width="wide" className="border-t border-border py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          How it works
        </p>
        <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex flex-col gap-3 bg-card p-6">
              <span className="flex size-8 items-center justify-center rounded-md bg-surface-2 font-mono text-sm text-text-secondary">
                {i + 1}
              </span>
              <h3 className="font-display text-lg font-medium text-foreground">
                {s.title}
              </h3>
              <p className="text-sm text-text-secondary">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* Feature grid */}
      <Container width="wide" className="border-t border-border py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Why Gooseneck
        </p>
        <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 bg-card p-6">
              <f.icon size={24} aria-hidden className="text-foreground" />
              <h3 className="font-display text-base font-medium text-foreground">
                {f.title}
              </h3>
              <p className="text-sm text-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* Sample recipes */}
      {samples.length > 0 && (
        <Container width="wide" className="border-t border-border py-16">
          <div className="flex items-end justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              From the community
            </p>
            <Link
              href="/feed"
              className="text-sm text-text-secondary underline hover:text-foreground"
            >
              Browse all →
            </Link>
          </div>
          <div className="mt-6">
            <RecipeGrid>
              {samples.map((r) => (
                <li key={r.id}>
                  <RecipeCard
                    href={`/r/${r.id}`}
                    title={r.title}
                    method={r.method}
                    photoUrl={r.photoUrl}
                    beanName={r.beanName}
                    dose={r.dose}
                    ratio={r.ratio}
                    author={r.author ?? "a Gooseneck user"}
                  />
                </li>
              ))}
            </RecipeGrid>
          </div>
        </Container>
      )}

      <SiteFooter />
    </>
  );
}
