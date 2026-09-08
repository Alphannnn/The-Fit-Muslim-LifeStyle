import {
  Card,
  EmptyState,
  LinkButton,
  PageHeading,
  Table,
  Td,
  Th,
} from "@/components/admin/ui/primitives";
import { Pagination, SearchInput } from "@/components/admin/ui/TableControls";
import { listSubscribers } from "@/lib/admin/queries";

export const metadata = { title: "Newsletter" };

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { rows, total, page, pages } = await listSubscribers({
    query: sp.q,
    page: Number(sp.page) || 1,
  });

  return (
    <>
      <PageHeading
        title="Newsletter"
        description="Everyone who opted in from the storefront footer."
        action={
          <LinkButton href="/admin/newsletter/export" variant="secondary">
            Export CSV
          </LinkButton>
        }
      />

      <Card className="mb-4" padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SearchInput placeholder="Email address…" />
          <span className="ml-auto text-[0.78rem] text-panel-muted">{total} subscribers</span>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No subscribers yet"
          description="The signup form in the storefront footer feeds this list."
        />
      ) : (
        <>
          <Table minWidth="30rem">
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Source</Th>
                <Th>Subscribed</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((subscriber) => (
                <tr key={subscriber.id}>
                  <Td className="font-medium text-panel-ink">{subscriber.email}</Td>
                  <Td className="capitalize">{subscriber.source}</Td>
                  <Td>
                    {subscriber.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} total={total} label="subscribers" />
        </>
      )}
    </>
  );
}
