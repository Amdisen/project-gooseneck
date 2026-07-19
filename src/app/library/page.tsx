import { and, desc, eq, isNull } from "drizzle-orm";
import { Trash } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db";
import { coffees, grinders, brewers, profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { ROAST_LEVELS } from "@/lib/validation/recipe";
import {
  createCoffee,
  deleteCoffee,
  createGrinder,
  deleteGrinder,
  createBrewer,
  deleteBrewer,
  setDefaultGrinder,
  setDefaultBrewer,
} from "./actions";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { Segmented } from "@/components/segmented";
import { List, ListRow } from "@/components/list-row";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/alert";
import { EmptyState } from "@/components/empty-state";

const TABS = [
  { key: "coffees", label: "Coffees" },
  { key: "grinders", label: "Grinders" },
  { key: "brewers", label: "Brewers" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Small ghost icon-button for a row's destructive action. */
function RemoveButton({ label }: { label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      type="submit"
      aria-label={label}
      className="text-text-muted hover:text-danger"
    >
      <Trash size={18} />
    </Button>
  );
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const user = await requireUser();
  const { error, tab: rawTab } = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === rawTab)
    ? (rawTab as TabKey)
    : "coffees";

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

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

  return (
    <Container width="app" className="flex flex-col gap-8 py-10">
      <PageHeader
        eyebrow="Library"
        title="Your gear & coffees"
        subtitle="Saved items pre-fill new recipes. Set a default grinder and brewer to auto-select them."
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Segmented
        items={TABS.map((t) => ({
          label: t.label,
          href: `/library?tab=${t.key}`,
          active: t.key === tab,
        }))}
      />

      {tab === "coffees" && (
        <section className="flex flex-col gap-4">
          {myCoffees.length > 0 ? (
            <List>
              {myCoffees.map((c) => (
                <ListRow
                  key={c.id}
                  label={c.name}
                  description={
                    [c.roaster, c.origin, c.roastLevel, c.process]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                >
                  <form action={deleteCoffee.bind(null, c.id)}>
                    <RemoveButton label={`Remove ${c.name}`} />
                  </form>
                </ListRow>
              ))}
            </List>
          ) : (
            <EmptyState message="No coffees yet. Add one below to reuse it across recipes." />
          )}

          <Card className="p-4">
            <form action={createCoffee} className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="name" placeholder="Name *" aria-label="Coffee name" required />
                <Input name="roaster" placeholder="Roaster" aria-label="Roaster" />
                <Input name="origin" placeholder="Origin" aria-label="Origin" />
                <Select name="roastLevel" defaultValue="" aria-label="Roast level">
                  <option value="">Roast level</option>
                  {ROAST_LEVELS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
                <Input
                  name="process"
                  placeholder="Process (washed, natural…)"
                  aria-label="Process"
                  list="process-options"
                />
                <datalist id="process-options">
                  <option value="Washed" />
                  <option value="Natural" />
                  <option value="Honey" />
                  <option value="Anaerobic" />
                </datalist>
              </div>
              <Button type="submit" className="self-start">
                Add coffee
              </Button>
            </form>
          </Card>
        </section>
      )}

      {tab === "grinders" && (
        <section className="flex flex-col gap-4">
          {myGrinders.length > 0 ? (
            <List>
              {myGrinders.map((g) => {
                const isDefault = profile?.defaultGrinderId === g.id;
                return (
                  <ListRow
                    key={g.id}
                    label={
                      <span className="flex items-center gap-2">
                        {g.name}
                        {isDefault && <Badge variant="solid">Default</Badge>}
                      </span>
                    }
                  >
                    <form
                      action={
                        isDefault
                          ? setDefaultGrinder.bind(null, null)
                          : setDefaultGrinder.bind(null, g.id)
                      }
                    >
                      <Button variant="ghost" size="sm" type="submit">
                        {isDefault ? "Unset default" : "Make default"}
                      </Button>
                    </form>
                    <form action={deleteGrinder.bind(null, g.id)}>
                      <RemoveButton label={`Remove ${g.name}`} />
                    </form>
                  </ListRow>
                );
              })}
            </List>
          ) : (
            <EmptyState message="No grinders yet. Add your grinder to track its settings." />
          )}

          <Card className="p-4">
            <form action={createGrinder} className="flex gap-2">
              <Input
                className="flex-1"
                name="name"
                placeholder="Grinder name (e.g. Comandante C40)"
                aria-label="Grinder name"
                required
              />
              <Button type="submit">Add</Button>
            </form>
          </Card>
        </section>
      )}

      {tab === "brewers" && (
        <section className="flex flex-col gap-4">
          {myBrewers.length > 0 ? (
            <List>
              {myBrewers.map((b) => {
                const isDefault = profile?.defaultBrewerId === b.id;
                return (
                  <ListRow
                    key={b.id}
                    label={
                      <span className="flex items-center gap-2">
                        {b.name}
                        <Badge variant="method">{b.method}</Badge>
                        {isDefault && <Badge variant="solid">Default</Badge>}
                      </span>
                    }
                  >
                    <form
                      action={
                        isDefault
                          ? setDefaultBrewer.bind(null, null)
                          : setDefaultBrewer.bind(null, b.id)
                      }
                    >
                      <Button variant="ghost" size="sm" type="submit">
                        {isDefault ? "Unset default" : "Make default"}
                      </Button>
                    </form>
                    <form action={deleteBrewer.bind(null, b.id)}>
                      <RemoveButton label={`Remove ${b.name}`} />
                    </form>
                  </ListRow>
                );
              })}
            </List>
          ) : (
            <EmptyState message="No brewers yet. Add your V60 (more methods coming later)." />
          )}

          <Card className="p-4">
            <form action={createBrewer} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  name="name"
                  placeholder="Brewer name (e.g. Hario V60 02)"
                  aria-label="Brewer name"
                  required
                />
                <input type="hidden" name="method" value="v60" />
                <Button type="submit">Add</Button>
              </div>
              <p className="text-xs text-text-muted">
                V60 only for now — more brew methods later.
              </p>
            </form>
          </Card>
        </section>
      )}
    </Container>
  );
}
