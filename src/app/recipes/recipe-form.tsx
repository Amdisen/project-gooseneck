"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ROAST_LEVELS,
  recipeFormSchema,
  parseClock,
  secondsToClock,
  computeRatio,
  type RecipeFormValues,
} from "@/lib/validation/recipe";
import { createRecipe, updateDraft } from "./actions";

type PourRow = { target: string; at: string };

export type FormState = {
  title: string;
  beanName: string;
  roaster: string;
  origin: string;
  roastLevel: string;
  grinderName: string;
  grindSetting: string;
  dose: string;
  waterTemp: string;
  filterType: string;
  techniqueNotes: string;
  bloomWater: string;
  bloomUntil: string;
  pours: PourRow[];
};

const EMPTY: FormState = {
  title: "",
  beanName: "",
  roaster: "",
  origin: "",
  roastLevel: "",
  grinderName: "",
  grindSetting: "",
  dose: "",
  waterTemp: "",
  filterType: "",
  techniqueNotes: "",
  bloomWater: "",
  bloomUntil: "0:45",
  pours: [{ target: "", at: "1:15" }],
};

export function RecipeForm({
  mode,
  recipeId,
  initial,
}: {
  mode: "create" | "edit";
  recipeId?: string;
  initial?: FormState;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setPour(i: number, key: keyof PourRow, value: string) {
    setForm((f) => {
      const pours = f.pours.slice();
      pours[i] = { ...pours[i], [key]: value };
      return { ...f, pours };
    });
  }
  function addPour() {
    setForm((f) => ({ ...f, pours: [...f.pours, { target: "", at: "" }] }));
  }
  function removePour(i: number) {
    setForm((f) => ({ ...f, pours: f.pours.filter((_, idx) => idx !== i) }));
  }

  // Live preview: increments per pour, total water, ratio, total time.
  const preview = useMemo(() => {
    const bloom = parseFloat(form.bloomWater);
    const dose = parseFloat(form.dose);
    let prev = Number.isFinite(bloom) ? bloom : 0;
    const rows = form.pours.map((p) => {
      const target = parseFloat(p.target);
      const inc = Number.isFinite(target) ? target - prev : NaN;
      if (Number.isFinite(target)) prev = target;
      const sec = parseClock(p.at);
      return { inc, sec };
    });
    const total = Number.isFinite(prev) ? prev : NaN;
    const ratio =
      Number.isFinite(dose) && Number.isFinite(total) && dose > 0
        ? computeRatio(dose, total)
        : NaN;
    const lastSec = rows.reduce(
      (m, r) => (r.sec !== null && r.sec > m ? r.sec : m),
      0,
    );
    return { rows, total, ratio, lastSec };
  }, [form.bloomWater, form.dose, form.pours]);

  function toValues(): RecipeFormValues | null {
    const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
    const bloomUntil = parseClock(form.bloomUntil);
    const raw = {
      title: form.title,
      beanName: form.beanName,
      roaster: form.roaster,
      origin: form.origin,
      roastLevel: form.roastLevel === "" ? undefined : form.roastLevel,
      grinderName: form.grinderName,
      grindSetting: form.grindSetting,
      doseGrams: num(form.dose),
      waterTempC: num(form.waterTemp),
      filterType: form.filterType,
      techniqueNotes: form.techniqueNotes,
      bloomWaterGrams: num(form.bloomWater),
      bloomUntilSec: bloomUntil ?? undefined,
      pours: form.pours.map((p) => ({
        targetTotalGrams: num(p.target),
        atSec: parseClock(p.at) ?? undefined,
      })),
    };
    const parsed = recipeFormSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return null;
    }
    return parsed.data;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const values = toValues();
    if (!values) return;
    startTransition(async () => {
      try {
        if (mode === "create") await createRecipe(values);
        else await updateDraft(recipeId!, values);
      } catch (err) {
        // A redirect throws internally; only show genuine errors.
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setError(err.message);
        }
      }
    });
  }

  const field = "rounded border border-gray-300 px-3 py-2";
  const labelCls = "flex flex-col gap-1 text-sm";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <label className={labelCls}>
        <span className="font-medium">Title *</span>
        <input
          className={field}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Morning Ethiopian"
        />
      </label>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold">Bean</legend>
        <label className={labelCls}>
          <span>Name</span>
          <input className={field} value={form.beanName} onChange={(e) => set("beanName", e.target.value)} />
        </label>
        <label className={labelCls}>
          <span>Roaster</span>
          <input className={field} value={form.roaster} onChange={(e) => set("roaster", e.target.value)} />
        </label>
        <label className={labelCls}>
          <span>Origin</span>
          <input className={field} value={form.origin} onChange={(e) => set("origin", e.target.value)} />
        </label>
        <label className={labelCls}>
          <span>Roast level</span>
          <select className={field} value={form.roastLevel} onChange={(e) => set("roastLevel", e.target.value)}>
            <option value="">—</option>
            {ROAST_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold">Grinder</legend>
        <label className={labelCls}>
          <span>Grinder</span>
          <input className={field} value={form.grinderName} onChange={(e) => set("grinderName", e.target.value)} />
        </label>
        <label className={labelCls}>
          <span>Grind setting</span>
          <input className={field} value={form.grindSetting} onChange={(e) => set("grindSetting", e.target.value)} placeholder="e.g. 22 clicks" />
        </label>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-1 text-sm font-semibold">Brew</legend>
        <label className={labelCls}>
          <span>Dose (g) *</span>
          <input className={field} type="number" step="0.1" value={form.dose} onChange={(e) => set("dose", e.target.value)} placeholder="18" />
        </label>
        <label className={labelCls}>
          <span>Water temp (°C)</span>
          <input className={field} type="number" step="1" value={form.waterTemp} onChange={(e) => set("waterTemp", e.target.value)} placeholder="94" />
        </label>
        <label className={labelCls}>
          <span>Filter</span>
          <input className={field} value={form.filterType} onChange={(e) => set("filterType", e.target.value)} placeholder="Hario tabbed" />
        </label>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold">Bloom</legend>
        <label className={labelCls}>
          <span>Bloom water (g) *</span>
          <input className={field} type="number" step="1" value={form.bloomWater} onChange={(e) => set("bloomWater", e.target.value)} placeholder="50" />
        </label>
        <label className={labelCls}>
          <span>Bloom until (m:ss) *</span>
          <input className={field} value={form.bloomUntil} onChange={(e) => set("bloomUntil", e.target.value)} placeholder="0:45" />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold">
          Pours — total water on the scale, and the time to reach it
        </legend>
        {form.pours.map((p, i) => (
          <div key={i} className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span>Up to (g)</span>
              <input
                className={field}
                type="number"
                step="1"
                value={p.target}
                onChange={(e) => setPour(i, "target", e.target.value)}
                placeholder={i === 0 ? "150" : "250"}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span>By (m:ss)</span>
              <input
                className={field}
                value={p.at}
                onChange={(e) => setPour(i, "at", e.target.value)}
                placeholder="1:15"
              />
            </label>
            <span className="pb-2 text-xs text-gray-500 w-20">
              {Number.isFinite(preview.rows[i]?.inc)
                ? `+${preview.rows[i].inc.toFixed(0)}g`
                : ""}
            </span>
            <button
              type="button"
              onClick={() => removePour(i)}
              disabled={form.pours.length === 1}
              className="mb-2 rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-40"
              aria-label="Remove pour"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addPour}
          className="self-start rounded border border-gray-300 px-3 py-1 text-sm"
        >
          + Add pour
        </button>
      </fieldset>

      <label className={labelCls}>
        <span className="font-medium">Notes</span>
        <textarea
          className={field}
          rows={3}
          value={form.techniqueNotes}
          onChange={(e) => set("techniqueNotes", e.target.value)}
          placeholder="Swirl after bloom; gentle center pours…"
        />
      </label>

      <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm">
        <span className="font-medium">Summary: </span>
        {Number.isFinite(preview.total) ? `${preview.total.toFixed(0)}g water` : "—g water"}
        {" · "}
        {Number.isFinite(preview.ratio) ? `1:${preview.ratio}` : "1:—"} ratio
        {" · "}
        {preview.lastSec > 0 ? secondsToClock(preview.lastSec) : "—"} total
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : mode === "create" ? "Create recipe" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-gray-300 px-4 py-2 font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
