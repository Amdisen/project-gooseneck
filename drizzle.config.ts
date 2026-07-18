import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // We manage the auth schema via Supabase; only touch our own tables.
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
