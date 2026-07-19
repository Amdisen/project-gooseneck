import { Drop } from "@phosphor-icons/react/dist/ssr";
import { secondsToClock, type PourStep } from "@/lib/validation/recipe";

/**
 * Pour timeline — the signature recipe data pattern (design.md §4.5). Vertical
 * list; the bloom row is emphasized with a surface-2 fill and a Drop icon; each
 * pour shows target-this-step, cumulative, and the time window in mono.
 */
export function PourTimeline({
  bloomWaterGrams,
  bloomSeconds,
  pours,
}: {
  bloomWaterGrams: number | null;
  bloomSeconds: number | null;
  pours: PourStep[];
}) {
  const bloom = bloomWaterGrams ?? 0;
  let running = bloom;
  const steps = pours.map((p) => {
    running += p.waterGrams;
    return { at: p.stepEndAtSec, add: p.waterGrams, total: running };
  });

  return (
    <ol className="overflow-hidden rounded-lg border border-border">
      <li className="flex items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3">
        <span className="flex items-center gap-2.5">
          <Drop size={18} weight="fill" aria-hidden className="text-text-secondary" />
          <span className="font-display font-medium text-foreground">Bloom</span>
        </span>
        <span className="font-mono text-sm text-text-secondary">
          {bloom}g · until {secondsToClock(bloomSeconds ?? 0)}
        </span>
      </li>
      {steps.map((s, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-md bg-surface-2 font-mono text-xs text-text-secondary">
              {i + 1}
            </span>
            <span className="font-display font-medium text-foreground">
              Pour {i + 1}
            </span>
          </span>
          <span className="font-mono text-sm text-text-secondary">
            +{s.add}g → {s.total}g · by {secondsToClock(s.at)}
          </span>
        </li>
      ))}
    </ol>
  );
}
