import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeVersions } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { secondsToClock, versionToFormPours } from "@/lib/validation/recipe";
import { RecipeForm, type FormState } from "../../recipe-form";

export default async function EditRecipePage({
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

  const cumulative = versionToFormPours(
    draft.bloomWaterGrams ?? 0,
    draft.pours ?? [],
  );

  const initial: FormState = {
    title: recipe.title,
    beanName: draft.beanName ?? "",
    roaster: draft.roaster ?? "",
    origin: draft.origin ?? "",
    roastLevel: draft.roastLevel ?? "",
    process: draft.process ?? "",
    beanPhotoUrl: draft.beanPhotoUrl ?? "",
    grinderName: draft.grinderName ?? "",
    grindSetting: draft.grindSetting ?? "",
    grindPhotoUrl: draft.grindPhotoUrl ?? "",
    dose: draft.doseGrams != null ? String(draft.doseGrams) : "",
    waterTemp: draft.waterTempC != null ? String(draft.waterTempC) : "",
    filterType: draft.filterType ?? "",
    techniqueNotes: draft.techniqueNotes ?? "",
    bloomWater:
      draft.bloomWaterGrams != null ? String(draft.bloomWaterGrams) : "",
    bloomUntil: secondsToClock(draft.bloomSeconds ?? 0),
    pours: cumulative.map((p) => ({
      target: String(p.targetTotalGrams),
      at: secondsToClock(p.atSec),
    })),
  };

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <Link href={`/recipes/${id}`} className="text-sm text-gray-500 underline">
        ← Back to recipe
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">Edit recipe</h1>
      <RecipeForm mode="edit" recipeId={id} initial={initial} />
    </main>
  );
}
