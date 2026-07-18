import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeVersions, brewLogs } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { secondsToClock } from "@/lib/validation/recipe";
import { BrewFlow, type BrewInitial } from "./brew-flow";

export default async function BrewPage({
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
  if (!draft) redirect(`/recipes/${id}`);

  const [lastLog] = await db
    .select({ changeNext: brewLogs.changeNext })
    .from(brewLogs)
    .where(eq(brewLogs.recipeId, id))
    .orderBy(desc(brewLogs.brewedAt))
    .limit(1);

  const initial: BrewInitial = {
    recipeId: id,
    title: recipe.title,
    suggestion: lastLog?.changeNext ?? null,
    hasPrevious: Boolean(lastLog),
    waterGrams: draft.waterGrams,
    grindSetting: draft.grindSetting ?? "",
    doseGrams: draft.doseGrams != null ? String(draft.doseGrams) : "",
    waterTempC: draft.waterTempC != null ? String(draft.waterTempC) : "",
    bloomWaterGrams:
      draft.bloomWaterGrams != null ? String(draft.bloomWaterGrams) : "",
    bloomClock: secondsToClock(draft.bloomSeconds ?? 0),
  };

  return <BrewFlow initial={initial} />;
}
