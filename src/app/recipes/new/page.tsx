import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { coffees, grinders, brewers, profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { RecipeForm } from "../recipe-form";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";

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
    <Container width="prose" className="flex flex-col gap-8 py-10">
      <PageHeader
        eyebrow="New recipe"
        title="New V60 recipe"
        subtitle="Capture every variable so you can re-brew it exactly."
      />
      <RecipeForm
        mode="create"
        coffees={myCoffees}
        grinders={myGrinders}
        brewers={myBrewers}
        defaults={defaults}
      />
    </Container>
  );
}
