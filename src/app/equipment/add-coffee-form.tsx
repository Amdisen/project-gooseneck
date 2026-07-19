"use client";

import { useState } from "react";
import { ROAST_LEVELS } from "@/lib/validation/recipe";
import { createCoffee } from "./actions";
import { PhotoUpload } from "@/app/recipes/photo-upload";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/**
 * Add-coffee form. Client component so the bean-bag-label photo (uploaded
 * client-side via PhotoUpload) rides along to the server action through a
 * hidden input. Submits to the existing `createCoffee` action.
 */
export function AddCoffeeForm() {
  const [photoUrl, setPhotoUrl] = useState("");

  return (
    <Card className="p-4">
      <form action={createCoffee} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="name" placeholder="Name *" aria-label="Coffee name" required />
          <Input name="roaster" placeholder="Roaster" aria-label="Roaster" />
          <Input name="origin" placeholder="Origin" aria-label="Origin" />
          <Select name="roastLevel" defaultValue="" aria-label="Roast level">
            <option value="">Roast level</option>
            {ROAST_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Input
            name="process"
            placeholder="Process (washed, natural…)"
            aria-label="Process"
            list="process-options"
          />
          <datalist id="process-options">
            <option value="Washed" />
            <option value="Natural" />
            <option value="Honey" />
            <option value="Anaerobic" />
          </datalist>
        </div>

        <PhotoUpload
          label="Bean bag label"
          value={photoUrl}
          onChange={setPhotoUrl}
        />
        <input type="hidden" name="photoUrl" value={photoUrl} />

        <Button type="submit" className="self-start">
          Add coffee
        </Button>
      </form>
    </Card>
  );
}
