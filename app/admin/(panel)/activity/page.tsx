import {
  Badge,
  Card,
  EmptyState,
  PageHeading,
  Table,
  Td,
  Th,
} from "@/components/admin/ui/primitives";
import { FilterSelect, Pagination, SearchInput } from "@/components/admin/ui/TableControls";
import { requireFullAdmin } from "@/lib/admin/auth";
import { auditActions, listAudit } from "@/lib/admin/audit";

export const metadata = { title: "Activity" };

/* Colour by what the action does, not by which entity it touched. */
function toneFor(action: string) {
  if (action.startsWith("auth.login_failed")) return "danger" as const;
  if (action.startsWith("auth.")) return "neutral" as const;
  if (action.includes("deleted") || action.includes("revoked")) return "danger" as const;
  if (action.includes("created") || action.includes("approved") || action.includes("accepted"))
    return "success" as const;
  return "info" as const;
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; page?: string }>;
}) {
  await requireFullAdmin("/admin/activity");
  const sp = await searchParams;

  const [{ entries, total, pages }, actions] = await Promise.all([
    listAudit({ query: sp.q, action: sp.action, page: Number(sp.page) || 1 }),
    auditActions(),
  ]);
  const page = Number(sp.page) || 1;

  return (
    <>
      <PageHeading
        title="Activity"
        description="Every state-changing action taken in this panel, including failed sign-ins."
      />

      <Card className="mb-4" padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SearchInput placeholder="Who or what…" />
          <FilterSelect
            paramName="action"
            label="Filter by action"
            allLabel="All actions"
            options={actions.map((a) => ({ value: a, label: a }))}
          />
          <span className="ml-auto text-[0.78rem] text-panel-muted">{total} entries</span>
        </div>
      </Card>

      {entries.length === 0 ? (
        <EmptyState
          title="Nothing recorded yet"
          description="Actions appear here the moment someone changes something."
        />
      ) : (
        <>
          <Table minWidth="46rem">
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Action</Th>
                <Th>What happened</Th>
                <Th>IP</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <Td>
                    <span className="whitespace-nowrap text-[0.78rem]">
                      {entry.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="block text-[0.72rem] text-panel-muted">
                      {entry.createdAt.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </Td>
                  <Td>
                    {entry.actorName ? (
                      <>
                        <span className="font-medium text-panel-ink">{entry.actorName}</span>
                        <span className="block truncate text-[0.72rem] text-panel-muted">
                          {entry.actorEmail}
                        </span>
                      </>
                    ) : (
                      <span className="text-panel-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={toneFor(entry.action)}>{entry.action}</Badge>
                  </Td>
                  <Td>
                    <span className="text-[0.82rem]">{entry.summary}</span>
                  </Td>
                  <Td>
                    <span className="font-mono text-[0.72rem] text-panel-muted">
                      {entry.ip ?? "—"}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} total={total} label="entries" />
        </>
      )}
    </>
  );
}
