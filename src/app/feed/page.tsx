import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, recipeVersions, profiles } from "@/lib/db/schema";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeGrid } from "@/components/recipe-grid";
import { EmptyState } from "@/components/empty-state";

export default async function FeedPage() {
  const rows = await db
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
    .limit(50);

  return (
    <Container width="wide" className="flex flex-col gap-8 py-10">
      <PageHeader eyebrow="Discover" title="Public recipes" />

      {rows.length === 0 ? (
        <EmptyState
          message="No public recipes yet. Publish one from your recipe page to share it here."
        />
      ) : (
        <RecipeGrid>
          {rows.map((r) => (
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
      )}
    </Container>
  );
}
