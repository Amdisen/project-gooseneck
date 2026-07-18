"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeVersions, brewLogs } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import {
  recipeFormSchema,
  formToVersionInput,
  computeRatio,
  computeTotalBrewSeconds,
  type RecipeVersionInput,
} from "@/lib/validation/recipe";

/** Map validated version input to a recipe_versions row (derived cols filled). */
function versionRow(input: RecipeVersionInput) {
  return {
    beanName: input.beanName ?? null,
    roaster: input.roaster ?? null,
    origin: input.origin ?? null,
    roastLevel: input.roastLevel ?? null,
    beanPhotoUrl: input.beanPhotoUrl ?? null,
    grinderName: input.grinderName ?? null,
    grindSetting: input.grindSetting ?? null,
    grindPhotoUrl: input.grindPhotoUrl ?? null,
    doseGrams: input.doseGrams,
    waterGrams: input.waterGrams,
    waterTempC: input.waterTempC ?? null,
    filterType: input.filterType ?? null,
    techniqueNotes: input.techniqueNotes ?? null,
    bloomWaterGrams: input.bloomWaterGrams ?? null,
    bloomSeconds: input.bloomSeconds ?? null,
    pours: input.pours,
    ratio: computeRatio(input.doseGrams, input.waterGrams),
    totalBrewSeconds: computeTotalBrewSeconds(input.pours),
  };
}

/** Confirm the recipe exists and belongs to the current user; returns it. */
async function requireOwnedRecipe(recipeId: string, userId: string) {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);
  if (!recipe || recipe.ownerId !== userId) redirect("/recipes");
  return recipe;
}

export async function createRecipe(raw: unknown) {
  const user = await requireUser();
  const parsed = recipeFormSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid recipe.");
  }

  const input = formToVersionInput(parsed.data);

  const [recipe] = await db
    .insert(recipes)
    .values({ ownerId: user.id, title: parsed.data.title, method: "v60" })
    .returning({ id: recipes.id });

  // The recipe's editable working state is a single draft version row.
  await db
    .insert(recipeVersions)
    .values({ recipeId: recipe.id, isDraft: true, ...versionRow(input) });

  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

export async function updateDraft(recipeId: string, raw: unknown) {
  const user = await requireUser();
  await requireOwnedRecipe(recipeId, user.id);

  const parsed = recipeFormSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid recipe.");
  }
  const input = formToVersionInput(parsed.data);

  const [draft] = await db
    .select({ id: recipeVersions.id })
    .from(recipeVersions)
    .where(
      and(
        eq(recipeVersions.recipeId, recipeId),
        eq(recipeVersions.isDraft, true),
      ),
    )
    .limit(1);

  if (draft) {
    await db
      .update(recipeVersions)
      .set(versionRow(input))
      .where(eq(recipeVersions.id, draft.id));
  } else {
    await db
      .insert(recipeVersions)
      .values({ recipeId, isDraft: true, ...versionRow(input) });
  }

  await db
    .update(recipes)
    .set({ title: parsed.data.title, updatedAt: new Date() })
    .where(eq(recipes.id, recipeId));

  revalidatePath(`/recipes/${recipeId}`);
  redirect(`/recipes/${recipeId}`);
}

/**
 * Snapshot the current draft into an immutable, numbered version and return its
 * id. Used automatically when a brew is logged, so the log records the exact
 * params brewed. Returns null if there's no draft.
 */
async function snapshotDraft(recipeId: string): Promise<string | null> {
  const [draft] = await db
    .select()
    .from(recipeVersions)
    .where(
      and(
        eq(recipeVersions.recipeId, recipeId),
        eq(recipeVersions.isDraft, true),
      ),
    )
    .limit(1);
  if (!draft) return null;

  const [latest] = await db
    .select({ n: recipeVersions.versionNumber })
    .from(recipeVersions)
    .where(
      and(
        eq(recipeVersions.recipeId, recipeId),
        eq(recipeVersions.isDraft, false),
      ),
    )
    .orderBy(desc(recipeVersions.versionNumber))
    .limit(1);
  const nextNumber = (latest?.n ?? 0) + 1;

  const [saved] = await db
    .insert(recipeVersions)
    .values({
      recipeId,
      isDraft: false,
      versionNumber: nextNumber,
      beanName: draft.beanName,
      roaster: draft.roaster,
      origin: draft.origin,
      roastLevel: draft.roastLevel,
      beanPhotoUrl: draft.beanPhotoUrl,
      grinderName: draft.grinderName,
      grindSetting: draft.grindSetting,
      grindPhotoUrl: draft.grindPhotoUrl,
      doseGrams: draft.doseGrams,
      waterGrams: draft.waterGrams,
      waterTempC: draft.waterTempC,
      filterType: draft.filterType,
      techniqueNotes: draft.techniqueNotes,
      bloomWaterGrams: draft.bloomWaterGrams,
      bloomSeconds: draft.bloomSeconds,
      pours: draft.pours,
      ratio: draft.ratio,
      totalBrewSeconds: draft.totalBrewSeconds,
    })
    .returning({ id: recipeVersions.id });

  await db
    .update(recipes)
    .set({ currentVersionId: saved.id, updatedAt: new Date() })
    .where(eq(recipes.id, recipeId));

  return saved.id;
}

/** Log a brew: rating + tasting notes + "change next time", with an auto-snapshot. */
export async function logBrew(recipeId: string, formData: FormData) {
  const user = await requireUser();
  await requireOwnedRecipe(recipeId, user.id);

  const ratingRaw = formData.get("rating");
  const rating =
    ratingRaw && String(ratingRaw) !== ""
      ? Math.min(5, Math.max(1, parseInt(String(ratingRaw), 10)))
      : null;
  const notes = (formData.get("notes")?.toString() ?? "").trim() || null;
  const changeNext =
    (formData.get("changeNext")?.toString() ?? "").trim() || null;

  const versionId = await snapshotDraft(recipeId);

  await db.insert(brewLogs).values({
    userId: user.id,
    recipeId,
    recipeVersionId: versionId,
    rating,
    notes,
    changeNext,
  });

  revalidatePath(`/recipes/${recipeId}`);
  redirect(`/recipes/${recipeId}`);
}

export async function deleteRecipe(recipeId: string) {
  const user = await requireUser();
  await requireOwnedRecipe(recipeId, user.id);
  await db.delete(recipes).where(eq(recipes.id, recipeId));
  revalidatePath("/recipes");
  redirect("/recipes");
}
