import "./lib/db/env";
import { defineConfig } from "drizzle-kit";

/* Same database either way: a local file by default, or the Turso database the
   deployment uses when TURSO_DATABASE_URL is set — which is how the production
   schema gets pushed and seeded from a developer's machine. */
const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  `file:${process.env.DATABASE_FILE ?? ".data/tfm.db"}`;

export default defineConfig({
  dialect: "turso",
  schema: "./lib/db/schema.ts",
  out: "./.data/migrations",
  dbCredentials: { url, authToken: process.env.TURSO_AUTH_TOKEN },
});
