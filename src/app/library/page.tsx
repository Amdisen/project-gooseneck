import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
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

const field = "rounded border border-gray-300 px-3 py-2 text-sm";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Library</h1>
        <Link href="/recipes" className="text-sm text-gray-500 underline">
          My recipes
        </Link>
      </div>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {/* Coffees */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Coffees</h2>
        {myCoffees.length > 0 && (
          <ul className="flex flex-col divide-y divide-gray-200 rounded border border-gray-200 text-sm">
            {myCoffees.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-3">
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gray-500">
                    {c.roaster ? ` · ${c.roaster}` : ""}
                    {c.origin ? ` · ${c.origin}` : ""}
                    {c.roastLevel ? ` · ${c.roastLevel}` : ""}
                    {c.process ? ` · ${c.process}` : ""}
                  </span>
                </span>
                <form action={deleteCoffee.bind(null, c.id)}>
                  <button className="text-xs text-red-600 underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form
          action={createCoffee}
          className="flex flex-col gap-2 rounded border border-gray-200 p-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <input className={field} name="name" placeholder="Name *" required />
            <input className={field} name="roaster" placeholder="Roaster" />
            <input className={field} name="origin" placeholder="Origin" />
            <select className={field} name="roastLevel" defaultValue="">
              <option value="">Roast level</option>
              {ROAST_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              className={field}
              name="process"
              placeholder="Process (washed, natural…)"
              list="process-options"
            />
            <datalist id="process-options">
              <option value="Washed" />
              <option value="Natural" />
              <option value="Honey" />
              <option value="Anaerobic" />
            </datalist>
          </div>
          <button className="self-start rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            Add coffee
          </button>
        </form>
      </section>

      {/* Grinders */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Grinders</h2>
        {myGrinders.length > 0 && (
          <ul className="flex flex-col divide-y divide-gray-200 rounded border border-gray-200 text-sm">
            {myGrinders.map((g) => {
              const isDefault = profile?.defaultGrinderId === g.id;
              return (
                <li key={g.id} className="flex items-center justify-between p-3">
                  <span className="font-medium">
                    {g.name}
                    {isDefault && (
                      <span className="ml-2 text-xs text-gray-400">
                        ★ default
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    <form
                      action={
                        isDefault
                          ? setDefaultGrinder.bind(null, null)
                          : setDefaultGrinder.bind(null, g.id)
                      }
                    >
                      <button className="text-xs text-gray-500 underline">
                        {isDefault ? "Unset default" : "Make default"}
                      </button>
                    </form>
                    <form action={deleteGrinder.bind(null, g.id)}>
                      <button className="text-xs text-red-600 underline">
                        Remove
                      </button>
                    </form>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <form action={createGrinder} className="flex gap-2">
          <input
            className={`${field} flex-1`}
            name="name"
            placeholder="Grinder name (e.g. Comandante C40)"
            required
          />
          <button className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            Add
          </button>
        </form>
      </section>

      {/* Brewers */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Brewers</h2>
        {myBrewers.length > 0 && (
          <ul className="flex flex-col divide-y divide-gray-200 rounded border border-gray-200 text-sm">
            {myBrewers.map((b) => {
              const isDefault = profile?.defaultBrewerId === b.id;
              return (
                <li key={b.id} className="flex items-center justify-between p-3">
                  <span className="font-medium">
                    {b.name}
                    <span className="ml-2 text-xs uppercase text-gray-400">
                      {b.method}
                    </span>
                    {isDefault && (
                      <span className="ml-2 text-xs text-gray-400">
                        ★ default
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    <form
                      action={
                        isDefault
                          ? setDefaultBrewer.bind(null, null)
                          : setDefaultBrewer.bind(null, b.id)
                      }
                    >
                      <button className="text-xs text-gray-500 underline">
                        {isDefault ? "Unset default" : "Make default"}
                      </button>
                    </form>
                    <form action={deleteBrewer.bind(null, b.id)}>
                      <button className="text-xs text-red-600 underline">
                        Remove
                      </button>
                    </form>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <form action={createBrewer} className="flex gap-2">
          <input
            className={`${field} flex-1`}
            name="name"
            placeholder="Brewer name (e.g. Hario V60 02)"
            required
          />
          <input type="hidden" name="method" value="v60" />
          <button className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            Add
          </button>
        </form>
        <p className="text-xs text-gray-400">
          V60 only for now — more brew methods later.
        </p>
      </section>
    </main>
  );
}
