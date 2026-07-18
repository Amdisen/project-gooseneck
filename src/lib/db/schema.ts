import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { PourStep } from "@/lib/validation/recipe";
import {
  BREW_METHODS,
  ROAST_LEVELS,
  VISIBILITIES,
} from "@/lib/validation/recipe";

export const brewMethodEnum = pgEnum("brew_method", BREW_METHODS);
export const roastLevelEnum = pgEnum("roast_level", ROAST_LEVELS);
export const visibilityEnum = pgEnum("visibility", VISIBILITIES);

/**
 * Profile row, one per Supabase auth user. `id` matches auth.users.id (populated
 * by a DB trigger on signup — see drizzle/0000_*_triggers.sql / README).
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  username: text("username").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Recipe container. Holds identity and pointers; the actual brew parameters live
 * in recipe_versions. `currentVersionId` is an app-enforced pointer (no hard FK,
 * to avoid a circular constraint with recipe_versions).
 */
export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    method: brewMethodEnum("method").notNull().default("v60"),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    currentVersionId: uuid("current_version_id"),
    forkedFromRecipeId: uuid("forked_from_recipe_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("recipes_owner_idx").on(t.ownerId),
    index("recipes_visibility_idx").on(t.visibility),
  ],
);

/**
 * A snapshot of brew parameters. Exactly one draft row per recipe (isDraft=true,
 * versionNumber=null) is mutated in place while editing; "Save version" clones it
 * into an immutable row (isDraft=false, versionNumber assigned).
 *
 * `ratio` and `totalBrewSeconds` are denormalized derived values kept as real
 * columns so the public feed can sort/filter without parsing the pours JSON.
 */
export const recipeVersions = pgTable(
  "recipe_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number"),
    isDraft: boolean("is_draft").notNull().default(true),

    // Bean
    beanName: text("bean_name"),
    roaster: text("roaster"),
    origin: text("origin"),
    roastLevel: roastLevelEnum("roast_level"),
    beanPhotoUrl: text("bean_photo_url"),

    // Grinder
    grinderName: text("grinder_name"),
    grindSetting: text("grind_setting"),
    grindPhotoUrl: text("grind_photo_url"),

    // Core brew params
    doseGrams: real("dose_grams").notNull(),
    waterGrams: real("water_grams").notNull(),
    waterTempC: real("water_temp_c"),
    filterType: text("filter_type"),
    techniqueNotes: text("technique_notes"),

    // Bloom
    bloomWaterGrams: real("bloom_water_grams"),
    bloomSeconds: integer("bloom_seconds"),

    // Timeline
    pours: jsonb("pours").$type<PourStep[]>().notNull().default([]),

    // Denormalized derived columns (kept in sync on write)
    ratio: real("ratio"),
    totalBrewSeconds: integer("total_brew_seconds"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("recipe_versions_recipe_idx").on(t.recipeId)],
);

/** A logged brew: how a specific recipe version actually turned out. */
export const brewLogs = pgTable(
  "brew_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    recipeVersionId: uuid("recipe_version_id").references(
      () => recipeVersions.id,
      { onDelete: "set null" },
    ),
    rating: integer("rating"),
    notes: text("notes"),
    /** "What I'd change next time" — surfaced on the recipe before the next brew. */
    changeNext: text("change_next"),
    brewedAt: timestamp("brewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("brew_logs_recipe_idx").on(t.recipeId),
    index("brew_logs_user_idx").on(t.userId),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type RecipeVersion = typeof recipeVersions.$inferSelect;
export type BrewLog = typeof brewLogs.$inferSelect;
