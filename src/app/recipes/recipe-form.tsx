"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "@phosphor-icons/react/dist/ssr";
import {
  ROAST_LEVELS,
  recipeFormSchema,
  parseClock,
  secondsToClock,
  computeRatio,
  type RecipeFormValues,
  type RoastLevel,
} from "@/lib/validation/recipe";
import { createRecipe, updateDraft } from "./actions";
import {
  createCoffeeInline,
  createGrinderInline,
  createBrewerInline,
} from "@/app/library/actions";
import type { Coffee, Grinder, Brewer } from "@/lib/db/schema";
import { PhotoUpload } from "./photo-upload";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/alert";

type PourRow = { target: string; at: string };

export type FormState = {
  title: string;
  coffeeId: string;
  grinderId: string;
  brewerId: string;
  beanName: string;
  roaster: string;
  origin: string;
  roastLevel: string;
  process: string;
  beanPhotoUrl: string;
  grinderName: string;
  grindSetting: string;
  grindPhotoUrl: string;
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
  coffeeId: "",
  grinderId: "",
  brewerId: "",
  beanName: "",
  roaster: "",
  origin: "",
  roastLevel: "",
  process: "",
  beanPhotoUrl: "",
  grinderName: "",
  grindSetting: "",
  grindPhotoUrl: "",
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
  coffees,
  grinders,
  brewers,
  defaults,
}: {
  mode: "create" | "edit";
  recipeId?: string;
  initial?: FormState;
  coffees: Coffee[];
  grinders: Grinder[];
  brewers: Brewer[];
  defaults?: { grinderId?: string; grinderName?: string; brewerId?: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initial ?? {
      ...EMPTY,
      grinderId: defaults?.grinderId ?? "",
      grinderName: defaults?.grinderName ?? "",
      brewerId: defaults?.brewerId ?? "",
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Library lists (local so inline-added items appear immediately).
  const [coffeeList, setCoffeeList] = useState(coffees);
  const [grinderList, setGrinderList] = useState(grinders);
  const [brewerList, setBrewerList] = useState(brewers);
  const [adding, setAdding] = useState({
    coffee: false,
    grinder: false,
    brewer: false,
  });
  const [newCoffee, setNewCoffee] = useState({
    name: "",
    roaster: "",
    origin: "",
    roastLevel: "",
    process: "",
  });
  const [newGrinder, setNewGrinder] = useState("");
  const [newBrewer, setNewBrewer] = useState("");
  const [libError, setLibError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // --- Library pickers ---
  function pickCoffee(v: string) {
    setLibError(null);
    if (v === "__new__") return setAdding((a) => ({ ...a, coffee: true }));
    setAdding((a) => ({ ...a, coffee: false }));
    if (v === "") return set("coffeeId", "");
    const c = coffeeList.find((x) => x.id === v);
    if (c)
      setForm((f) => ({
        ...f,
        coffeeId: c.id,
        beanName: c.name,
        roaster: c.roaster ?? "",
        origin: c.origin ?? "",
        roastLevel: c.roastLevel ?? "",
        process: c.process ?? "",
        beanPhotoUrl: c.photoUrl ?? f.beanPhotoUrl,
      }));
  }
  async function addCoffee() {
    setLibError(null);
    if (!newCoffee.name.trim()) return setLibError("Coffee needs a name.");
    try {
      const c = await createCoffeeInline({
        name: newCoffee.name,
        roaster: newCoffee.roaster,
        origin: newCoffee.origin,
        roastLevel: newCoffee.roastLevel
          ? (newCoffee.roastLevel as RoastLevel)
          : undefined,
        process: newCoffee.process,
      });
      setCoffeeList((l) => [c, ...l]);
      setForm((f) => ({
        ...f,
        coffeeId: c.id,
        beanName: c.name,
        roaster: c.roaster ?? "",
        origin: c.origin ?? "",
        roastLevel: c.roastLevel ?? "",
        process: c.process ?? "",
      }));
      setNewCoffee({ name: "", roaster: "", origin: "", roastLevel: "", process: "" });
      setAdding((a) => ({ ...a, coffee: false }));
    } catch (e) {
      setLibError(e instanceof Error ? e.message : "Could not add coffee.");
    }
  }

  function pickGrinder(v: string) {
    setLibError(null);
    if (v === "__new__") return setAdding((a) => ({ ...a, grinder: true }));
    setAdding((a) => ({ ...a, grinder: false }));
    if (v === "") return set("grinderId", "");
    const g = grinderList.find((x) => x.id === v);
    if (g) setForm((f) => ({ ...f, grinderId: g.id, grinderName: g.name }));
  }
  async function addGrinder() {
    setLibError(null);
    if (!newGrinder.trim()) return setLibError("Grinder needs a name.");
    try {
      const g = await createGrinderInline({ name: newGrinder });
      setGrinderList((l) => [g, ...l]);
      setForm((f) => ({ ...f, grinderId: g.id, grinderName: g.name }));
      setNewGrinder("");
      setAdding((a) => ({ ...a, grinder: false }));
    } catch (e) {
      setLibError(e instanceof Error ? e.message : "Could not add grinder.");
    }
  }

  function pickBrewer(v: string) {
    setLibError(null);
    if (v === "__new__") return setAdding((a) => ({ ...a, brewer: true }));
    setAdding((a) => ({ ...a, brewer: false }));
    set("brewerId", v);
  }
  async function addBrewer() {
    setLibError(null);
    if (!newBrewer.trim()) return setLibError("Brewer needs a name.");
    try {
      const b = await createBrewerInline({ name: newBrewer, method: "v60" });
      setBrewerList((l) => [b, ...l]);
      set("brewerId", b.id);
      setNewBrewer("");
      setAdding((a) => ({ ...a, brewer: false }));
    } catch (e) {
      setLibError(e instanceof Error ? e.message : "Could not add brewer.");
    }
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

  function toValues(): RecipeFormValues | null {
    const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
    const bloomUntil = parseClock(form.bloomUntil);
    const raw = {
      title: form.title,
      coffeeId: form.coffeeId,
      grinderId: form.grinderId,
      brewerId: form.brewerId,
      beanName: form.beanName,
      roaster: form.roaster,
      origin: form.origin,
      roastLevel: form.roastLevel === "" ? undefined : form.roastLevel,
      process: form.process,
      beanPhotoUrl: form.beanPhotoUrl,
      grinderName: form.grinderName,
      grindSetting: form.grindSetting,
      grindPhotoUrl: form.grindPhotoUrl,
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
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setError(err.message);
        }
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {error && <Alert variant="danger">{error}</Alert>}
      {libError && <Alert variant="danger">{libError}</Alert>}

      <Field label="Title *">
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Morning Ethiopian"
        />
      </Field>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold text-foreground">Bean</legend>
        <Field label="Coffee (from your library)" className="sm:col-span-2">
          <Select
            value={adding.coffee ? "__new__" : form.coffeeId}
            onChange={(e) => pickCoffee(e.target.value)}
          >
            <option value="">— none / type below —</option>
            {coffeeList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.roaster ? ` · ${c.roaster}` : ""}
              </option>
            ))}
            <option value="__new__">+ New coffee…</option>
          </Select>
        </Field>
        {adding.coffee && (
          <Card className="flex flex-col gap-2 p-3 sm:col-span-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name *" value={newCoffee.name} onChange={(e) => setNewCoffee({ ...newCoffee, name: e.target.value })} />
              <Input placeholder="Roaster" value={newCoffee.roaster} onChange={(e) => setNewCoffee({ ...newCoffee, roaster: e.target.value })} />
              <Input placeholder="Origin" value={newCoffee.origin} onChange={(e) => setNewCoffee({ ...newCoffee, origin: e.target.value })} />
              <Select value={newCoffee.roastLevel} onChange={(e) => setNewCoffee({ ...newCoffee, roastLevel: e.target.value })}>
                <option value="">Roast level</option>
                {ROAST_LEVELS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
              <Input placeholder="Process" value={newCoffee.process} onChange={(e) => setNewCoffee({ ...newCoffee, process: e.target.value })} list="process-options" />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={addCoffee}>
                Add to library
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setAdding((a) => ({ ...a, coffee: false }))}>
                Cancel
              </Button>
            </div>
          </Card>
        )}
        <Field label="Name">
          <Input value={form.beanName} onChange={(e) => set("beanName", e.target.value)} />
        </Field>
        <Field label="Roaster">
          <Input value={form.roaster} onChange={(e) => set("roaster", e.target.value)} />
        </Field>
        <Field label="Origin">
          <Input value={form.origin} onChange={(e) => set("origin", e.target.value)} />
        </Field>
        <Field label="Roast level">
          <Select value={form.roastLevel} onChange={(e) => set("roastLevel", e.target.value)}>
            <option value="">—</option>
            {ROAST_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Process">
          <Input
            value={form.process}
            onChange={(e) => set("process", e.target.value)}
            placeholder="washed, natural…"
            list="process-options"
          />
          <datalist id="process-options">
            <option value="Washed" />
            <option value="Natural" />
            <option value="Honey" />
            <option value="Anaerobic" />
          </datalist>
        </Field>
        <div className="sm:col-span-2">
          <PhotoUpload
            label="Bean photo"
            value={form.beanPhotoUrl}
            onChange={(url) => set("beanPhotoUrl", url)}
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold text-foreground">Grinder</legend>
        <Field label="Grinder (from your library)" className="sm:col-span-2">
          <Select
            value={adding.grinder ? "__new__" : form.grinderId}
            onChange={(e) => pickGrinder(e.target.value)}
          >
            <option value="">— none / type below —</option>
            {grinderList.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
            <option value="__new__">+ New grinder…</option>
          </Select>
        </Field>
        {adding.grinder && (
          <div className="flex gap-2 sm:col-span-2">
            <Input className="flex-1" placeholder="Grinder name" value={newGrinder} onChange={(e) => setNewGrinder(e.target.value)} />
            <Button type="button" onClick={addGrinder}>Add</Button>
            <Button type="button" variant="secondary" onClick={() => setAdding((a) => ({ ...a, grinder: false }))}>Cancel</Button>
          </div>
        )}
        <Field label="Grinder name">
          <Input value={form.grinderName} onChange={(e) => set("grinderName", e.target.value)} />
        </Field>
        <Field label="Grind setting">
          <Input value={form.grindSetting} onChange={(e) => set("grindSetting", e.target.value)} placeholder="e.g. 22 clicks" />
        </Field>
        <div className="sm:col-span-2">
          <PhotoUpload
            label="Grind photo"
            value={form.grindPhotoUrl}
            onChange={(url) => set("grindPhotoUrl", url)}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold text-foreground">Brewer</legend>
        <Select
          value={adding.brewer ? "__new__" : form.brewerId}
          onChange={(e) => pickBrewer(e.target.value)}
        >
          <option value="">— none —</option>
          {brewerList.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
          <option value="__new__">+ New brewer…</option>
        </Select>
        {adding.brewer && (
          <div className="flex gap-2">
            <Input className="flex-1" placeholder="Brewer name (e.g. Hario V60 02)" value={newBrewer} onChange={(e) => setNewBrewer(e.target.value)} />
            <Button type="button" onClick={addBrewer}>Add</Button>
            <Button type="button" variant="secondary" onClick={() => setAdding((a) => ({ ...a, brewer: false }))}>Cancel</Button>
          </div>
        )}
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-1 text-sm font-semibold text-foreground">Brew</legend>
        <Field label="Dose (g) *">
          <Input type="number" inputMode="decimal" step="0.1" value={form.dose} onChange={(e) => set("dose", e.target.value)} placeholder="18" />
        </Field>
        <Field label="Water temp (°C)">
          <Input type="number" inputMode="numeric" step="1" value={form.waterTemp} onChange={(e) => set("waterTemp", e.target.value)} placeholder="94" />
        </Field>
        <Field label="Filter">
          <Input value={form.filterType} onChange={(e) => set("filterType", e.target.value)} placeholder="Hario tabbed" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold text-foreground">Bloom</legend>
        <Field label="Bloom water (g) *">
          <Input type="number" inputMode="numeric" step="1" value={form.bloomWater} onChange={(e) => set("bloomWater", e.target.value)} placeholder="50" />
        </Field>
        <Field label="Bloom until (m:ss) *">
          <Input value={form.bloomUntil} onChange={(e) => set("bloomUntil", e.target.value)} placeholder="0:45" />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold text-foreground">
          Pours — total water on the scale, and the time to reach it
        </legend>
        {form.pours.map((p, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label="Up to (g)" className="flex-1">
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                value={p.target}
                onChange={(e) => setPour(i, "target", e.target.value)}
                placeholder={i === 0 ? "150" : "250"}
              />
            </Field>
            <Field label="By (m:ss)" className="flex-1">
              <Input
                value={p.at}
                onChange={(e) => setPour(i, "at", e.target.value)}
                placeholder="1:15"
              />
            </Field>
            <span className="w-14 pb-3 font-mono text-xs text-text-muted">
              {Number.isFinite(preview.rows[i]?.inc)
                ? `+${preview.rows[i].inc.toFixed(0)}g`
                : ""}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => removePour(i)}
              disabled={form.pours.length === 1}
              aria-label="Remove pour"
            >
              <X size={16} />
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" className="self-start" onClick={addPour}>
          + Add pour
        </Button>
      </fieldset>

      <Field label="Notes">
        <Textarea
          rows={3}
          value={form.techniqueNotes}
          onChange={(e) => set("techniqueNotes", e.target.value)}
          placeholder="Swirl after bloom; gentle center pours…"
        />
      </Field>

      <Card className="bg-surface-2 p-3 text-sm text-foreground">
        <span className="font-medium">Summary: </span>
        <span className="font-mono">
          {Number.isFinite(preview.total) ? `${preview.total.toFixed(0)}g water` : "—g water"}
          {" · "}
          {Number.isFinite(preview.ratio) ? `1:${preview.ratio}` : "1:—"} ratio
          {" · "}
          {preview.lastSec > 0 ? secondsToClock(preview.lastSec) : "—"} total
        </span>
      </Card>

      <div className="sticky bottom-0 z-10 flex gap-2 border-t border-border bg-background py-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create recipe" : "Save changes"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
