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
  beanPhotoUrl: z.string().url().optional(),

  // Grinder
  grinderName: z.string().trim().max(120).optional(),
  grindSetting: z.string().trim().max(120).optional(),
  grindPhotoUrl: z.string().url().optional(),

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

// --- Clock helpers (mm:ss <-> seconds) -------------------------------------

/** 125 -> "2:05" */
export function secondsToClock(total: number): string {
  const safe = Math.max(0, Math.floor(total));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** "2:05" -> 125, or "90" -> 90. Returns null if unparseable. */
export function parseClock(value: string): number | null {
  const v = value.trim();
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  const m = v.match(/^(\d+):([0-5]?\d)$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

// --- Recipe form model (cumulative-total input) ----------------------------

/**
 * How the user enters pours: a running total the scale should read, and the
 * time to reach it. Bloom water is the starting total. We convert this to the
 * stored per-pour increments (PourStep) on save.
 */
export const cumulativePourSchema = z.object({
  /** Total water on the scale once this pour is done, in grams. */
  targetTotalGrams: z.number().positive().max(2000),
  /** Absolute time (s) from brew start to reach that total. */
  atSec: z.number().int().positive().max(1200),
});
export type CumulativePour = z.infer<typeof cumulativePourSchema>;

export const recipeFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give your recipe a title.").max(120),

    beanName: z.string().trim().max(120).optional().or(z.literal("")),
    roaster: z.string().trim().max(120).optional().or(z.literal("")),
    origin: z.string().trim().max(120).optional().or(z.literal("")),
    roastLevel: roastLevelSchema.optional(),
    beanPhotoUrl: z.string().url().optional().or(z.literal("")),

    grinderName: z.string().trim().max(120).optional().or(z.literal("")),
    grindSetting: z.string().trim().max(120).optional().or(z.literal("")),
    grindPhotoUrl: z.string().url().optional().or(z.literal("")),

    doseGrams: z.number().positive().max(200),
    waterTempC: z.number().min(1).max(100).optional(),
    filterType: z.string().trim().max(120).optional().or(z.literal("")),
    techniqueNotes: z.string().trim().max(2000).optional().or(z.literal("")),

    bloomWaterGrams: z.number().nonnegative().max(500),
    bloomUntilSec: z.number().int().nonnegative().max(600),

    pours: z.array(cumulativePourSchema).min(1, "Add at least one pour.").max(15),
  })
  .superRefine((v, ctx) => {
    // First pour must start after bloom, and exceed bloom water.
    let prevTotal = v.bloomWaterGrams;
    let prevTime = v.bloomUntilSec;
    v.pours.forEach((p, i) => {
      if (p.targetTotalGrams <= prevTotal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each total must be larger than the previous.",
          path: ["pours", i, "targetTotalGrams"],
        });
      }
      if (p.atSec <= prevTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each time must be later than the previous.",
          path: ["pours", i, "atSec"],
        });
      }
      prevTotal = p.targetTotalGrams;
      prevTime = p.atSec;
    });
  });
export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

const round1 = (n: number) => Math.round(n * 10) / 10;
const blank = (s?: string) => (s && s.trim() !== "" ? s.trim() : undefined);

/** Convert the cumulative-input form values into the stored version input. */
export function formToVersionInput(v: RecipeFormValues): RecipeVersionInput {
  const pours: PourStep[] = v.pours.map((p, i) => {
    const prevTotal = i === 0 ? v.bloomWaterGrams : v.pours[i - 1].targetTotalGrams;
    return {
      order: i,
      waterGrams: round1(p.targetTotalGrams - prevTotal),
      stepEndAtSec: p.atSec,
    };
  });
  const totalWater = v.pours[v.pours.length - 1].targetTotalGrams;

  return {
    beanName: blank(v.beanName),
    roaster: blank(v.roaster),
    origin: blank(v.origin),
    roastLevel: v.roastLevel,
    beanPhotoUrl: blank(v.beanPhotoUrl),
    grinderName: blank(v.grinderName),
    grindSetting: blank(v.grindSetting),
    grindPhotoUrl: blank(v.grindPhotoUrl),
    doseGrams: v.doseGrams,
    waterGrams: totalWater,
    waterTempC: v.waterTempC,
    filterType: blank(v.filterType),
    techniqueNotes: blank(v.techniqueNotes),
    bloomWaterGrams: v.bloomWaterGrams,
    bloomSeconds: v.bloomUntilSec,
    pours,
  };
}

/** Rebuild cumulative form values from stored version fields (for editing). */
export function versionToFormPours(
  bloomWaterGrams: number,
  pours: PourStep[],
): CumulativePour[] {
  let running = bloomWaterGrams;
  return pours.map((p) => {
    running = round1(running + p.waterGrams);
    return { targetTotalGrams: running, atSec: p.stepEndAtSec };
  });
}
