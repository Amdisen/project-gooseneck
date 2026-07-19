import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeVersions } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeGrid } from "@/components/recipe-grid";
import { EmptyState } from "@/components/empty-state";

export default async function RecipesPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      method: recipes.method,
      visibility: recipes.visibility,
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
    .where(eq(recipes.ownerId, user.id))
    .orderBy(desc(recipes.updatedAt));

  return (
    <Container width="wide" className="flex flex-col gap-8 py-10">
      <PageHeader
        eyebrow="My recipes"
        title="Recipes"
        actions={
          <Button asChild>
            <Link href="/recipes/new">+ New recipe</Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          message="No recipes yet. Create your first V60 recipe to get started."
          action={{ href: "/recipes/new", label: "Create your first" }}
        />
      ) : (
        <RecipeGrid>
          {rows.map((r) => (
            <li key={r.id}>
              <RecipeCard
                href={`/recipes/${r.id}`}
                title={r.title}
                method={r.method}
                photoUrl={r.photoUrl}
                beanName={r.beanName}
                dose={r.dose}
                ratio={r.ratio}
                visibility={r.visibility}
              />
            </li>
          ))}
        </RecipeGrid>
      )}
    </Container>
  );
}
