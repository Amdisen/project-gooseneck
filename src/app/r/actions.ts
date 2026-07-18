"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { comments, recipes } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";

const bodySchema = z.string().trim().min(1).max(1000);

export async function addComment(recipeId: string, formData: FormData) {
  const user = await requireUser();
  const parsed = bodySchema.safeParse(formData.get("body"));
  if (!parsed.success) redirect(`/r/${recipeId}`);

  const [recipe] = await db
    .select({ visibility: recipes.visibility, ownerId: recipes.ownerId })
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);
  if (
    !recipe ||
    (recipe.visibility !== "public" && recipe.ownerId !== user.id)
  ) {
    redirect(`/r/${recipeId}`);
  }

  await db
    .insert(comments)
    .values({ recipeId, userId: user.id, body: parsed.data });
  revalidatePath(`/r/${recipeId}`);
}

export async function deleteComment(recipeId: string, commentId: string) {
  const user = await requireUser();
  const [c] = await db
    .select({ userId: comments.userId, recipeId: comments.recipeId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!c) redirect(`/r/${recipeId}`);

  const [recipe] = await db
    .select({ ownerId: recipes.ownerId })
    .from(recipes)
    .where(eq(recipes.id, c.recipeId))
    .limit(1);
  if (c.userId !== user.id && recipe?.ownerId !== user.id) {
    redirect(`/r/${recipeId}`);
  }

  await db.delete(comments).where(eq(comments.id, commentId));
  revalidatePath(`/r/${recipeId}`);
}

export async function reportComment(recipeId: string, commentId: string) {
  await requireUser();
  await db
    .update(comments)
    .set({ reportedAt: new Date() })
    .where(eq(comments.id, commentId));
  revalidatePath(`/r/${recipeId}`);
}
