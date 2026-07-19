import { notFound, redirect } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  recipes,
  recipeVersions,
  coffees,
  grinders,
  brewers,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { secondsToClock, versionToFormPours } from "@/lib/validation/recipe";
import { RecipeForm, type FormState } from "../../recipe-form";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";

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

  const [myCoffees, myGrinders, myBrewers] = await Promise.all([
    db
      .select()
      .from(coffees)
      .where(and(eq(coffees.ownerId, user.id), isNull(coffees.archivedAt)))
      .orderBy(desc(coffees.createdAt)),
    db
      .select()
      .from(grinders)
      .where(and(eq(grinders.ownerId, user.id), isNull(grinders.archivedAt)))
      .orderBy(desc(grinders.createdAt)),
    db
      .select()
      .from(brewers)
      .where(and(eq(brewers.ownerId, user.id), isNull(brewers.archivedAt)))
      .orderBy(desc(brewers.createdAt)),
  ]);

  const cumulative = versionToFormPours(
    draft.bloomWaterGrams ?? 0,
    draft.pours ?? [],
  );

  const initial: FormState = {
    title: recipe.title,
    coffeeId: recipe.coffeeId ?? "",
    grinderId: recipe.grinderId ?? "",
    brewerId: recipe.brewerId ?? "",
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
    <Container width="prose" className="flex flex-col gap-8 py-10">
      <PageHeader eyebrow="Edit" title="Edit recipe" />
      <RecipeForm
        mode="edit"
        recipeId={id}
        initial={initial}
        coffees={myCoffees}
        grinders={myGrinders}
        brewers={myBrewers}
      />
    </Container>
  );
}
