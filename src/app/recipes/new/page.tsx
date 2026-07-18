import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { coffees, grinders, brewers, profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { RecipeForm } from "../recipe-form";

export default async function NewRecipePage() {
  const user = await requireUser();

  const [myCoffees, myGrinders, myBrewers, profileRows] = await Promise.all([
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
    db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1),
  ]);

  const profile = profileRows[0];
  const defaultGrinder = myGrinders.find(
    (g) => g.id === profile?.defaultGrinderId,
  );
  const defaults = {
    grinderId: profile?.defaultGrinderId ?? "",
    grinderName: defaultGrinder?.name ?? "",
    brewerId: profile?.defaultBrewerId ?? "",
  };

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <Link href="/recipes" className="text-sm text-gray-500 underline">
        ← My recipes
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">New V60 recipe</h1>
      <RecipeForm
        mode="create"
        coffees={myCoffees}
        grinders={myGrinders}
        brewers={myBrewers}
        defaults={defaults}
      />
    </main>
  );
}
