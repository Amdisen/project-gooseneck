// Applies a raw .sql file to the database using DATABASE_URL from .env.local.
// Usage: node scripts/apply-sql.mjs supabase/setup.sql
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-sql.mjs <path-to-.sql>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (check .env.local).");
  process.exit(1);
}

const sqlText = readFileSync(file, "utf8");
const sql = postgres(url, { prepare: false, max: 1 });

try {
  // simple-query protocol: runs the whole file (multiple statements) at once.
  await sql.unsafe(sqlText);
  console.log(`✓ Applied ${file}`);
} catch (err) {
  console.error(`✗ Failed to apply ${file}:`);
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
