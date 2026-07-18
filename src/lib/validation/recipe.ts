import { z } from "zod";

/**
 * Brewing methods. V60 is the only method for the initial build, but the enum
 * is the single extension point for adding Chemex/Aeropress/espresso later.
 */
export const BREW_METHODS = ["v60"] as const;
export const brewMethodSchema = z.enum(BREW_METHODS);
export type BrewMethod = z.infer<typeof brewMethodSchema>;

export const ROAST_LEVELS = [
  "light",
  "medium-light",
  "medium",
  "medium-dark",
  "dark",
] as const;
export const roastLevelSchema = z.enum(ROAST_LEVELS);
export type RoastLevel = z.infer<typeof roastLevelSchema>;

export const VISIBILITIES = ["private", "public"] as const;
export const visibilitySchema = z.enum(VISIBILITIES);
export type Visibility = z.infer<typeof visibilitySchema>;

/**
 * A single pour in the brew timeline. `stepEndAtSec` is the ABSOLUTE elapsed
 * time (from brew start) at which this step should end — the timer derives its
 * countdown from these, computed against a start timestamp so it never drifts.
 */
export const pourStepSchema = z.object({
  order: z.number().int().nonnegative(),
  /** Water poured during this step, in grams. */
  waterGrams: z.number().positive(),
  /** Optional target duration of the pour itself, in seconds. */
  pourDurationSec: z.number().int().nonnegative().optional(),
  /** Absolute elapsed time (s) from brew start when this step ends. */
  stepEndAtSec: z.number().int().nonnegative(),
  note: z.string().max(280).optional(),
});
export type PourStep = z.infer<typeof pourStepSchema>;

export const pourStepsSchema = z
  .array(pourStepSchema)
  .max(20)
  .superRefine((steps, ctx) => {
    // stepEndAtSec must be strictly increasing so the timeline is coherent.
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].stepEndAtSec <= steps[i - 1].stepEndAtSec) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pour step end times must increase in order.",
          path: [i, "stepEndAtSec"],
        });
      }
    }
  });

/**
 * The editable brew parameters that make up a recipe version. Ratio and total
 * brew time are DERIVED (see helpers) rather than stored as independent inputs,
 * to avoid contradictory data.
 */
export const recipeVersionInputSchema = z.object({
  // Bean
  beanName: z.string().trim().min(1).max(120).optional(),
  roaster: z.string().trim().max(120).optional(),
  origin: z.string().trim().max(120).optional(),
  roastLevel: roastLevelSchema.optional(),

  // Grinder
  grinderName: z.string().trim().max(120).optional(),
  grindSetting: z.string().trim().max(120).optional(),

  // Core brew params
  doseGrams: z.number().positive().max(200),
  waterGrams: z.number().positive().max(2000),
  waterTempC: z.number().min(1).max(100).optional(),
  filterType: z.string().trim().max(120).optional(),
  techniqueNotes: z.string().trim().max(2000).optional(),

  // Bloom
  bloomWaterGrams: z.number().nonnegative().max(500),
  bloomSeconds: z.number().int().nonnegative().max(600),

  // Timeline
  pours: pourStepsSchema,
});
export type RecipeVersionInput = z.infer<typeof recipeVersionInputSchema>;

/** Coffee-to-water ratio, derived. Returns e.g. 16.67 for 15g:250g. */
export function computeRatio(doseGrams: number, waterGrams: number): number {
  if (doseGrams <= 0) return 0;
  return Math.round((waterGrams / doseGrams) * 100) / 100;
}

/** Total brew time in seconds, derived from the last pour's end time. */
export function computeTotalBrewSeconds(pours: PourStep[]): number {
  if (pours.length === 0) return 0;
  return Math.max(...pours.map((p) => p.stepEndAtSec));
}
