"use client";

import { useRef, useState } from "react";
import { ImageSquare } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const BUCKET = "recipe-photos";

function isHeic(file: File) {
  return (
    /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
  );
}

export function PhotoUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      // 1. HEIC/HEIF (common on iPhones) -> JPEG in the browser.
      let working: Blob = file;
      if (isHeic(file)) {
        const heic2any = (await import("heic2any")).default;
        const out = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        });
        working = Array.isArray(out) ? out[0] : out;
      }

      // 2. Compress + re-encode to WebP. Re-encoding through canvas also
      //    strips EXIF metadata (including GPS) — important for a public feed.
      const imageCompression = (await import("browser-image-compression"))
        .default;
      const asFile = new File([working], "photo", {
        type: working.type || "image/jpeg",
      });
      const compressed = await imageCompression(asFile, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/webp",
      });

      // 3. Upload to Supabase Storage under the user's own folder.
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to upload.");

      const path = `${user.id}/${crypto.randomUUID()}.webp`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed, { contentType: "image/webp" });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className="size-16 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-md border border-dashed border-border-strong text-text-muted">
            <ImageSquare size={22} aria-hidden />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.heic,.heif"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? "Uploading…" : value ? "Replace" : "Add photo"}
            </Button>
            {value && !busy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
              >
                Remove
              </Button>
            )}
          </div>
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      </div>
    </div>
  );
}
