/**
 * Issues a staff invitation link from the command line.
 *
 *   pnpm admin:invite you@example.com admin
 *
 * This is the bootstrap path: the panel has no sign-up form, so the very first
 * admin on a fresh database is created from here. After that, invitations are
 * normally issued from Admin → Team.
 */
import "../lib/db/env"; // before ../lib/db, which reads process.env as it loads
import { eq, inArray } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { createInvite } from "../lib/admin/invites";

async function main() {
  const [email, roleArg] = process.argv.slice(2);
  const role = roleArg === "coach" ? "coach" : "admin";

  if (!email || !email.includes("@")) {
    console.error("Usage: pnpm admin:invite <email> [admin|coach]");
    process.exit(1);
  }

  const normalised = email.trim().toLowerCase();

  const existing = await db.select().from(users).where(eq(users.email, normalised)).get();
  if (existing) {
    console.error(
      `\n✗ ${normalised} already has an account (role: ${existing.role}).\n` +
        `  Change their role from Admin → Team instead of inviting them again.\n`,
    );
    process.exit(1);
  }

  /* Attribute the invite to an existing admin where there is one, so the audit
     trail has an actor. On a fresh database there is nobody, and that is fine. */
  const firstAdmin = await db
    .select()
    .from(users)
    .where(inArray(users.role, ["admin"]))
    .get();

  const { url, invite } = await createInvite({
    email: normalised,
    role,
    invitedBy: firstAdmin?.id ?? "",
    note: "Issued from the command line",
  });

  console.log(`
✓ Invitation created for ${normalised} as ${role}

  ${url}

  Valid for 7 days, single use. Send it to them over a channel you trust —
  anyone holding this link can create the account.
  Expires: ${invite.expiresAt.toLocaleString()}
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
