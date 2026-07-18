"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";

const displayNameSchema = z.string().trim().min(1).max(80);

export async function updateDisplayName(formData: FormData) {
  const user = await requireUser();

  const parsed = displayNameSchema.safeParse(formData.get("displayName"));
  if (!parsed.success) return; // input has required/maxLength; ignore bad input

  await db
    .update(profiles)
    .set({ displayName: parsed.data })
    .where(eq(profiles.id, user.id));

  revalidatePath("/account");
}
