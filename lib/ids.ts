import { randomBytes, randomUUID } from "node:crypto";

export const newId = (): string => randomUUID();

/** Crockford-ish alphabet: no vowels, no look-alikes (0/O, 1/I). */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Short, human-readable, unambiguous over the phone — e.g. TFM-8Q4XK2 */
export function newOrderNumber(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return `TFM-${code}`;
}

/** URL-safe opaque token, used for session cookies. */
export const newToken = (): string => randomBytes(32).toString("base64url");

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
