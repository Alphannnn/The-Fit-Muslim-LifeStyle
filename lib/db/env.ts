/**
 * Loads `.env.local` then `.env`, the way `next dev` does.
 *
 * Imported for its side effect, and imported FIRST — before `./index` — because
 * module imports are hoisted: the database client reads `process.env` as it is
 * created, so anything loaded after that point arrives too late. This is what
 * lets `pnpm db:push` and `pnpm db:seed` be pointed at the deployment's Turso
 * database from a developer's machine.
 */
import { existsSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}
