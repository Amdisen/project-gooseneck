import type { RecipeVersion } from "@/lib/db/schema";
import { secondsToClock } from "@/lib/validation/recipe";

/**
 * Human-readable list of what changed between two param snapshots — e.g.
 * `["grind 22 → 25", "bloom time 0:45 → 0:50"]`. Used for the change-history
 * table, the "changed since last brew" nudge, and the "won't repeat" list.
 */
export function diffSnapshots(
  prev: RecipeVersion,
  curr: RecipeVersion,
): string[] {
  const out: string[] = [];
  const cmp = (
    label: string,
    a: unknown,
    b: unknown,
    fmt: (x: never) => string = (x) => String(x),
  ) => {
    const av = a ?? null;
    const bv = b ?? null;
    if (av !== bv) {
      out.push(
        `${label} ${av === null ? "—" : fmt(av as never)} → ${
          bv === null ? "—" : fmt(bv as never)
        }`,
      );
    }
  };
  cmp("dose", prev.doseGrams, curr.doseGrams, (x: number) => `${x}g`);
  cmp("grind", prev.grindSetting, curr.grindSetting);
  cmp("water", prev.waterGrams, curr.waterGrams, (x: number) => `${x}g`);
  cmp("temp", prev.waterTempC, curr.waterTempC, (x: number) => `${x}°C`);
  cmp(
    "bloom water",
    prev.bloomWaterGrams,
    curr.bloomWaterGrams,
    (x: number) => `${x}g`,
  );
  cmp(
    "bloom time",
    prev.bloomSeconds,
    curr.bloomSeconds,
    (x: number) => secondsToClock(x),
  );
  cmp("ratio", prev.ratio, curr.ratio, (x: number) => `1:${x}`);
  cmp("bean", prev.beanName, curr.beanName);
  cmp("process", prev.process, curr.process);
  cmp("grinder", prev.grinderName, curr.grinderName);
  cmp("filter", prev.filterType, curr.filterType);
  if (JSON.stringify(prev.pours) !== JSON.stringify(curr.pours)) {
    out.push(
      `pour schedule (${prev.pours?.length ?? 0} → ${curr.pours?.length ?? 0} pours)`,
    );
  }
  return out;
}
