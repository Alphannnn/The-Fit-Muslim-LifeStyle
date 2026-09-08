import { getAdminUser } from "@/lib/admin/auth";
import { record } from "@/lib/admin/audit";
import { allSubscriberEmails } from "@/lib/admin/queries";

/* Route handlers sit outside the layout tree, so the guard is repeated here
   rather than inherited — a bare fetch of this URL must not leak the list. */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return new Response("Not authorised.", { status: 403 });

  const rows = await allSubscriberEmails();

  /* Escape per RFC 4180 so a comma or quote in a value cannot break the file. */
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = [
    "email,source,subscribed_at",
    ...rows.map((r) =>
      [escape(r.email), escape(r.source), escape(r.createdAt.toISOString())].join(","),
    ),
  ].join("\r\n");

  await record({
    actor: user,
    action: "customer.updated",
    entity: "newsletter",
    summary: `Exported ${rows.length} newsletter subscribers`,
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
