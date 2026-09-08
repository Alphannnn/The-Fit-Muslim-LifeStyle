import { createHash } from "node:crypto";

/** Tokens are stored only as a sha256 digest — the raw value lives in the URL. */
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
