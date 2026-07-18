"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  computeRatio,
  parseClock,
  type ActualPour,
  type PourStep,
} from "@/lib/validation/recipe";
import { brewAndLog } from "../../actions";
import { BrewTimer, type TimerStep } from "./brew-timer";

export type BrewInitial = {
  recipeId: string;
  title: string;
  suggestion: string | null;
  hasPrevious: boolean;
  waterGrams: number;
  grindSetting: string;
  doseGrams: string;
  waterTempC: string;
  bloomWaterGrams: string;
  bloomClock: string;
  pours: PourStep[];
};

const OUTCOMES = [
  { value: "better", label: "Better 👍" },
  { value: "same", label: "About the same" },
  { value: "worse", label: "Worse 👎" },
] as const;

export function BrewFlow({ initial }: { initial: BrewInitial }) {
  const [step, setStep] = useState(0);
  const [grind, setGrind] = useState(initial.grindSetting);
  const [dose, setDose] = useState(initial.doseGrams);
  const [temp, setTemp] = useState(initial.waterTempC);
  const [bloomWater, setBloomWater] = useState(initial.bloomWaterGrams);
  const [bloomTime, setBloomTime] = useState(initial.bloomClock);
  const [outcome, setOutcome] = useState<"" | "better" | "same" | "worse">("");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [changeNext, setChangeNext] = useState("");
  const [actuals, setActuals] = useState<ActualPour[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const doseNum = parseFloat(dose);
  const ratio =
    Number.isFinite(doseNum) && doseNum > 0
      ? computeRatio(doseNum, initial.waterGrams)
      : null;

  // Timer timeline from the (possibly adjusted) bloom + the recipe's pours.
  const timerSteps = useMemo<TimerStep[]>(() => {
    const bw = parseFloat(bloomWater) || 0;
    const bloomSec = parseClock(bloomTime) ?? 0;
    const out: TimerStep[] = [
      { label: "Bloom", targetTotal: Math.round(bw), endAtSec: bloomSec },
    ];
    let running = bw;
    initial.pours.forEach((p, i) => {
      running += p.waterGrams;
      out.push({
        label: `Pour ${i + 1}`,
        targetTotal: Math.round(running),
        endAtSec: p.stepEndAtSec,
      });
    });
    return out;
  }, [bloomWater, bloomTime, initial.pours]);

  const field = "rounded border border-gray-300 px-3 py-2";

  function submit() {
    setError(null);
    if (initial.hasPrevious && !outcome) {
      setError("Please say how it compared to your last brew.");
      setStep(2);
      return;
    }
    const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
    const payload = {
      grindSetting: grind.trim() || undefined,
      doseGrams: num(dose),
      waterTempC: num(temp),
      bloomWaterGrams: num(bloomWater),
      bloomSeconds:
        bloomTime.trim() === "" ? undefined : (parseClock(bloomTime) ?? undefined),
      outcome: outcome || undefined,
      rating: num(rating),
      notes: notes.trim() || undefined,
      changeNext: changeNext.trim() || undefined,
      actuals: actuals.length ? actuals : undefined,
    };
    startTransition(async () => {
      try {
        await brewAndLog(initial.recipeId, payload);
      } catch (err) {
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setError(err.message);
        }
      }
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      <div>
        <Link
          href={`/recipes/${initial.recipeId}`}
          className="text-sm text-gray-500 underline"
        >
          ← Back to recipe
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Brew {initial.title}</h1>
        <p className="text-xs text-gray-400">Step {step + 1} of 3</p>
      </div>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {/* Step 1 — adjust */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          {initial.suggestion && (
            <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <span className="font-medium">You planned to try:</span>{" "}
              {initial.suggestion}
            </p>
          )}
          <p className="text-sm text-gray-500">
            Adjust anything you&apos;re changing this time, then continue.{" "}
            <span className="text-gray-400">
              Tip: change one thing at a time so you learn what made the
              difference.
            </span>
          </p>

          <label className="flex flex-col gap-1 text-sm">
            <span>Grind setting</span>
            <input
              className={field}
              value={grind}
              onChange={(e) => setGrind(e.target.value)}
              placeholder="e.g. 22 clicks"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span>Dose (g)</span>
              <input
                className={field}
                type="number"
                step="0.1"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Water temp (°C)</span>
              <input
                className={field}
                type="number"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Bloom water (g)</span>
              <input
                className={field}
                type="number"
                value={bloomWater}
                onChange={(e) => setBloomWater(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Bloom until (m:ss)</span>
              <input
                className={field}
                value={bloomTime}
                onChange={(e) => setBloomTime(e.target.value)}
              />
            </label>
          </div>

          <p className="text-sm text-gray-500">
            {initial.waterGrams}g water · ratio {ratio ? `1:${ratio}` : "—"}
          </p>
          <Link
            href={`/recipes/${initial.recipeId}/edit`}
            className="text-sm text-gray-500 underline"
          >
            Need to change water, pours or photos? Edit full recipe →
          </Link>

          <button
            onClick={() => setStep(1)}
            className="rounded bg-gray-900 px-4 py-2 font-medium text-white"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2 — guided timer */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
          <BrewTimer
            steps={timerSteps}
            onDone={(a) => {
              setActuals(a);
              setStep(2);
            }}
          />
          <div className="flex justify-between text-sm">
            <button
              onClick={() => setStep(0)}
              className="text-gray-500 underline"
            >
              ← Adjust
            </button>
            <button
              onClick={() => setStep(2)}
              className="text-gray-500 underline"
            >
              Skip timer →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — result */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          {initial.hasPrevious && (
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Compared to your last brew?</span>
              <div className="flex flex-col gap-2">
                {OUTCOMES.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setOutcome(o.value)}
                    className={`rounded border px-4 py-2 text-left ${
                      outcome === o.value
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span>Rating (optional)</span>
            <select
              className={`${field} w-32`}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} ({n})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>Tasting notes</span>
            <textarea
              className={field}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bright, a little sour, thin body…"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>Anything to try next time? (optional)</span>
            <textarea
              className={field}
              rows={3}
              value={changeNext}
              onChange={(e) => setChangeNext(e.target.value)}
              placeholder="Grind a touch finer; extend bloom to 0:50…"
            />
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="rounded border border-gray-300 px-4 py-2 font-medium"
            >
              Back
            </button>
            <button
              onClick={submit}
              disabled={pending}
              className="rounded bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save brew"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
