import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/* SQLite in both places: a file on disk in development, Turso (the same engine
   over HTTP) in production. A serverless host hands every request a read-only,
   throwaway filesystem, so the database cannot be a file beside the code there
   — an order would be written into a container that is discarded seconds later.
   The dialect is identical either way, so every query in the app is unchanged. */

const FILE = process.env.DATABASE_FILE ?? ".data/tfm.db";
const URL = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? `file:${FILE}`;

declare global {
  var __tfmDb: ReturnType<typeof create> | undefined;
}

function create() {
  /* Say so at once, rather than building a catalogue-shaped hole: on Vercel a
     file database silently starts empty, the build prerenders a shop with no
     products, and the first sign of trouble is a live site missing everything. */
  if (process.env.VERCEL && URL.startsWith("file:")) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. A file database cannot work on Vercel — every " +
        "request gets a read-only, throwaway disk. Add TURSO_DATABASE_URL and " +
        "TURSO_AUTH_TOKEN to the project's environment variables (all environments).",
    );
  }
  if (URL.startsWith("file:")) mkdirSync(dirname(URL.slice("file:".length)), { recursive: true });
  const client = createClient({ url: URL, authToken: process.env.TURSO_AUTH_TOKEN });
  /* Local files start with foreign keys off; Turso enforces them already. Fire
     and forget — every query below runs on the same connection, after this. */
  if (URL.startsWith("file:")) {
    void client.execute("PRAGMA foreign_keys = ON").catch(() => {});
  }
  return drizzle(client, { schema });
}

/* Next's dev server re-evaluates modules on every edit; caching on globalThis
   stops us leaking a new connection each time. */
export const db = globalThis.__tfmDb ?? create();
if (process.env.NODE_ENV !== "production") globalThis.__tfmDb = db;

/** Async accessor, kept so a driver that connects lazily stays a one-liner. */
export async function getDb() {
  return db;
}

export { schema };
