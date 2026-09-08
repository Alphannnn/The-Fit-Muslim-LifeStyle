import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/* SQLite keeps the whole platform runnable with zero provisioning. The only
   Postgres-specific thing anywhere in the app is this file — swap the driver
   for `drizzle-orm/node-postgres` and the queries carry over unchanged. */

const DB_FILE = process.env.DATABASE_FILE ?? ".data/tfm.db";

declare global {
  var __tfmDb: ReturnType<typeof create> | undefined;
}

function create() {
  mkdirSync(dirname(DB_FILE), { recursive: true });
  const sqlite = new Database(DB_FILE);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  /* dev servers open several connections as routes compile — wait instead of
     throwing SQLITE_BUSY when two of them write at once */
  sqlite.pragma("busy_timeout = 5000");
  return drizzle(sqlite, { schema });
}

/* Next's dev server re-evaluates modules on every edit; caching on globalThis
   stops us leaking a new sqlite handle each time. */
export const db = globalThis.__tfmDb ?? create();
if (process.env.NODE_ENV !== "production") globalThis.__tfmDb = db;

/** Async accessor, so swapping in a driver that connects lazily is a one-liner. */
export async function getDb() {
  return db;
}

export { schema };
