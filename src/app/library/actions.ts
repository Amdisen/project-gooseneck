"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  coffees,
  grinders,
  brewers,
  profiles,
  type Coffee,
  type Grinder,
  type Brewer,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import {
  coffeeInputSchema,
  grinderInputSchema,
  brewerInputSchema,
  type CoffeeInput,
  type GrinderInput,
  type BrewerInput,
} from "@/lib/validation/library";

function s(fd: FormData, k: string) {
  const v = fd.get(k);
  return typeof v === "string" ? v : "";
}

function fail(message: string): never {
  redirect(`/library?error=${encodeURIComponent(message)}`);
}

// --- Coffees ---------------------------------------------------------------

export async function createCoffee(formData: FormData) {
  const user = await requireUser();
  const parsed = coffeeInputSchema.safeParse({
    name: s(formData, "name"),
    roaster: s(formData, "roaster"),
    origin: s(formData, "origin"),
    roastLevel: s(formData, "roastLevel") || undefined,
    process: s(formData, "process"),
    photoUrl: s(formData, "photoUrl"),
  });
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Invalid coffee.");
  const d = parsed.data;
  await db.insert(coffees).values({
    ownerId: user.id,
    name: d.name,
    roaster: d.roaster || null,
    origin: d.origin || null,
    roastLevel: d.roastLevel ?? null,
    process: d.process || null,
    photoUrl: d.photoUrl || null,
  });
  revalidatePath("/library");
  redirect("/library");
}

export async function deleteCoffee(id: string) {
  const user = await requireUser();
  await db
    .delete(coffees)
    .where(and(eq(coffees.id, id), eq(coffees.ownerId, user.id)));
  revalidatePath("/library");
  redirect("/library");
}

// --- Grinders --------------------------------------------------------------

export async function createGrinder(formData: FormData) {
  const user = await requireUser();
  const parsed = grinderInputSchema.safeParse({ name: s(formData, "name") });
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Invalid grinder.");
  await db.insert(grinders).values({ ownerId: user.id, name: parsed.data.name });
  revalidatePath("/library");
  redirect("/library");
}

export async function deleteGrinder(id: string) {
  const user = await requireUser();
  await db
    .delete(grinders)
    .where(and(eq(grinders.id, id), eq(grinders.ownerId, user.id)));
  revalidatePath("/library");
  redirect("/library");
}

// --- Brewers ---------------------------------------------------------------

export async function createBrewer(formData: FormData) {
  const user = await requireUser();
  const parsed = brewerInputSchema.safeParse({
    name: s(formData, "name"),
    method: s(formData, "method") || "v60",
  });
  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Invalid brewer.");
  await db
    .insert(brewers)
    .values({ ownerId: user.id, name: parsed.data.name, method: parsed.data.method });
  revalidatePath("/library");
  redirect("/library");
}

export async function deleteBrewer(id: string) {
  const user = await requireUser();
  await db
    .delete(brewers)
    .where(and(eq(brewers.id, id), eq(brewers.ownerId, user.id)));
  revalidatePath("/library");
  redirect("/library");
}

// --- Inline create (called from the recipe form; returns the new row) ------

export async function createCoffeeInline(input: CoffeeInput): Promise<Coffee> {
  const user = await requireUser();
  const d = coffeeInputSchema.parse(input);
  const [row] = await db
    .insert(coffees)
    .values({
      ownerId: user.id,
      name: d.name,
      roaster: d.roaster || null,
      origin: d.origin || null,
      roastLevel: d.roastLevel ?? null,
      process: d.process || null,
      photoUrl: d.photoUrl || null,
    })
    .returning();
  revalidatePath("/library");
  return row;
}

export async function createGrinderInline(
  input: GrinderInput,
): Promise<Grinder> {
  const user = await requireUser();
  const d = grinderInputSchema.parse(input);
  const [row] = await db
    .insert(grinders)
    .values({ ownerId: user.id, name: d.name })
    .returning();
  revalidatePath("/library");
  return row;
}

export async function createBrewerInline(input: BrewerInput): Promise<Brewer> {
  const user = await requireUser();
  const d = brewerInputSchema.parse(input);
  const [row] = await db
    .insert(brewers)
    .values({ ownerId: user.id, name: d.name, method: d.method })
    .returning();
  revalidatePath("/library");
  return row;
}

// --- Profile defaults ------------------------------------------------------

export async function setDefaultGrinder(id: string | null) {
  const user = await requireUser();
  await db
    .update(profiles)
    .set({ defaultGrinderId: id })
    .where(eq(profiles.id, user.id));
  revalidatePath("/library");
  revalidatePath("/account");
}

export async function setDefaultBrewer(id: string | null) {
  const user = await requireUser();
  await db
    .update(profiles)
    .set({ defaultBrewerId: id })
    .where(eq(profiles.id, user.id));
  revalidatePath("/library");
  revalidatePath("/account");
}
