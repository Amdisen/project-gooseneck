// One-off: convert the heavy PNG assets in public/ to lean WebP (max 1000px, q72).
// Writes <name>.webp alongside each source. Safe to re-run.
import { readdirSync, statSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import sharp from "sharp";

const targets = [
  "public/recipe-card-default.png",
  ...readdirSync("public/recipe-cards")
    .filter((f) => f.endsWith(".png"))
    .map((f) => join("public/recipe-cards", f)),
  ...readdirSync("public/coffee-bags")
    .filter((f) => f.endsWith(".png"))
    .map((f) => join("public/coffee-bags", f)),
];

for (const src of targets) {
  const out = join(dirname(src), basename(src, extname(src)) + ".webp");
  await sharp(src)
    .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(out);
  const before = (statSync(src).size / 1024).toFixed(0);
  const after = (statSync(out).size / 1024).toFixed(0);
  console.log(`  ${out}  ${before}KB → ${after}KB`);
}
console.log(`✓ Optimized ${targets.length} image(s).`);
