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
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/alert";

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
    <Container width="prose" className="flex flex-col gap-6 py-10">
      <PageHeader
        eyebrow={`Step ${step + 1} of 3`}
        title={`Brew ${initial.title}`}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Step 1 — adjust */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          {initial.suggestion && (
            <Card className="bg-surface-2 p-3 text-sm text-foreground">
              <span className="font-medium">You planned to try:</span>{" "}
              {initial.suggestion}
            </Card>
          )}
          <p className="text-sm text-text-secondary">
            Adjust anything you&apos;re changing this time, then continue.{" "}
            <span className="text-text-muted">
              Tip: change one thing at a time so you learn what made the
              difference.
            </span>
          </p>

          <Field label="Grind setting">
            <Input
              value={grind}
              onChange={(e) => setGrind(e.target.value)}
              placeholder="e.g. 22 clicks"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dose (g)">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
              />
            </Field>
            <Field label="Water temp (°C)">
              <Input
                type="number"
                inputMode="numeric"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
              />
            </Field>
            <Field label="Bloom water (g)">
              <Input
                type="number"
                inputMode="numeric"
                value={bloomWater}
                onChange={(e) => setBloomWater(e.target.value)}
              />
            </Field>
            <Field label="Bloom until (m:ss)">
              <Input
                value={bloomTime}
                onChange={(e) => setBloomTime(e.target.value)}
              />
            </Field>
          </div>

          <p className="font-mono text-sm text-text-secondary">
            {initial.waterGrams}g water · ratio {ratio ? `1:${ratio}` : "—"}
          </p>
          <Link
            href={`/recipes/${initial.recipeId}/edit`}
            className="text-sm text-text-secondary underline hover:text-foreground"
          >
            Need to change water, pours or photos? Edit full recipe →
          </Link>

          <Button className="self-start" onClick={() => setStep(1)}>
            Continue
          </Button>
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
            <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
              ← Adjust
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
              Skip timer →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — result */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          {initial.hasPrevious && (
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">
                Compared to your last brew?
              </span>
              <div className="flex flex-col gap-2">
                {OUTCOMES.map((o) => (
                  <Button
                    key={o.value}
                    type="button"
                    variant={outcome === o.value ? "primary" : "secondary"}
                    className="w-full justify-start"
                    onClick={() => setOutcome(o.value)}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Field label="Rating (optional)">
            <Select
              className="w-36"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} ({n})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tasting notes">
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bright, a little sour, thin body…"
            />
          </Field>

          <Field label="Anything to try next time? (optional)">
            <Textarea
              rows={3}
              value={changeNext}
              onChange={(e) => setChangeNext(e.target.value)}
              placeholder="Grind a touch finer; extend bloom to 0:50…"
            />
          </Field>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? "Saving…" : "Save brew"}
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
