// Seeds 6 public V60 recipes for visually testing the feed grid.
// 3 have bean photos, 3 don't (to exercise the "media only if photo" card).
// Attributed to the newest recipe's owner (i.e. you).
//
//   node scripts/seed-feed.mjs          # insert (removes prior seed first)
//   node scripts/seed-feed.mjs --clean  # remove the seed rows and exit
//
// Rows are tagged via technique_notes so cleanup is exact and never touches
// your real recipes. Test-only data.
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (check .env.local).");
  process.exit(1);
}

const TAG = "[seed-feed]"; // marker stored in technique_notes
const clean = process.argv.includes("--clean");

const sql = postgres(url, { prepare: false, max: 1 });

// Local optimized WebP images (see scripts/optimize-images.mjs). A few rows are
// left photo-less on purpose to exercise the card's default-image fallback.
const RECIPES = [
  { title: "Ethiopia Yirgacheffe", beanName: "Yirgacheffe G1", roaster: "The Coffee Collective", origin: "Ethiopia", process: "Washed", dose: 15, ratio: 16, temp: 94, photo: "/recipe-cards/coffee-1.webp" },
  { title: "Kenya Nyeri AA",       beanName: "Nyeri AA",        roaster: "La Cabra",              origin: "Kenya",    process: "Washed", dose: 18, ratio: 15, temp: 96, photo: null },
  { title: "Colombia El Paraíso",  beanName: "El Paraíso Geisha", roaster: "Friedhats",           origin: "Colombia", process: "Thermal Shock", dose: 16, ratio: 16, temp: 92, photo: "/recipe-cards/coffee-2.webp" },
  { title: "Guatemala Huehuetenango", beanName: "Huehue SHB",  roaster: "April",                 origin: "Guatemala", process: "Washed", dose: 14, ratio: 17, temp: 93, photo: null },
  { title: "Rwanda Nyamasheke",    beanName: "Nyamasheke",      roaster: "Prolog",                origin: "Rwanda",   process: "Natural", dose: 20, ratio: 16, temp: 95, photo: "/recipe-cards/coffee-4.webp" },
  { title: "Brazil Cerrado",       beanName: "Cerrado Natural", roaster: "Gardelli",              origin: "Brazil",   process: "Natural", dose: 17, ratio: 15, temp: 90, photo: "/recipe-cards/coffee-5.webp" },
];

try {
  // Resolve an owner: whoever owns the most-recent recipe, else the first profile.
  const ownerRow =
    (await sql`select owner_id as id from recipes order by created_at desc limit 1`)[0] ??
    (await sql`select id from profiles order by created_at asc limit 1`)[0];

  if (!ownerRow?.id) {
    console.error("No profile found to attribute recipes to. Sign up first.");
    process.exit(1);
  }
  const ownerId = ownerRow.id;

  // Always clear any prior seed (cascade removes the versions).
  const removed = await sql`
    delete from recipes
    where owner_id = ${ownerId}
      and id in (
        select recipe_id from recipe_versions
        where is_draft = true and technique_notes = ${TAG}
      )
    returning id
  `;
  console.log(`Removed ${removed.length} previously seeded recipe(s).`);

  if (clean) {
    console.log("Clean complete.");
    process.exit(0);
  }

  let n = 0;
  for (let i = 0; i < RECIPES.length; i++) {
    const r = RECIPES[i];
    const water = Math.round(r.dose * r.ratio);
    const [recipe] = await sql`
      insert into recipes (owner_id, title, method, visibility, published_at)
      values (${ownerId}, ${r.title}, 'v60', 'public', now() - (${i} || ' minutes')::interval)
      returning id
    `;
    await sql`
      insert into recipe_versions
        (recipe_id, is_draft, bean_name, roaster, origin, process, bean_photo_url,
         dose_grams, water_grams, water_temp_c, ratio, technique_notes)
      values
        (${recipe.id}, true, ${r.beanName}, ${r.roaster}, ${r.origin}, ${r.process}, ${r.photo},
         ${r.dose}, ${water}, ${r.temp}, ${r.ratio}, ${TAG})
    `;
    n++;
    console.log(`  + ${r.title}${r.photo ? " (photo)" : ""}`);
  }
  console.log(`\n✓ Seeded ${n} public recipes. Reload http://localhost:3000/feed`);
} catch (err) {
  console.error("✗ Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
