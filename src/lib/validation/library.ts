import { z } from "zod";
import { roastLevelSchema, brewMethodSchema } from "./recipe";

export const coffeeInputSchema = z.object({
  name: z.string().trim().min(1, "Give the coffee a name.").max(120),
  roaster: z.string().trim().max(120).optional().or(z.literal("")),
  origin: z.string().trim().max(120).optional().or(z.literal("")),
  roastLevel: roastLevelSchema.optional(),
  process: z.string().trim().max(60).optional().or(z.literal("")),
  photoUrl: z.string().url().optional().or(z.literal("")),
});
export type CoffeeInput = z.infer<typeof coffeeInputSchema>;

export const grinderInputSchema = z.object({
  name: z.string().trim().min(1, "Give the grinder a name.").max(120),
});
export type GrinderInput = z.infer<typeof grinderInputSchema>;

export const brewerInputSchema = z.object({
  name: z.string().trim().min(1, "Give the brewer a name.").max(120),
  method: brewMethodSchema.default("v60"),
});
export type BrewerInput = z.infer<typeof brewerInputSchema>;
