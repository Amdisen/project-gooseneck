import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and add your Supabase Postgres connection string.",
  );
}

// `prepare: false` is required when connecting through Supabase's transaction
// pooler (port 6543). A single client is reused across the serverless instance.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export { schema };
