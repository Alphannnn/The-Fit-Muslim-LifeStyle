import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  PageHeading,
  Table,
  Td,
  Th,
} from "@/components/admin/ui/primitives";
import { FilterSelect, SearchInput } from "@/components/admin/ui/TableControls";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalPosts } from "@/lib/db/schema";

export const metadata = { title: "Journal" };

export default async function AdminJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; q?: string; state?: string; category?: string }>;
}) {
  const [sp, rows] = await Promise.all([
    searchParams,
    db.select().from(journalPosts).orderBy(desc(journalPosts.createdAt)).all(),
  ]);

  const categories = [...new Set(rows.map((p) => p.category))].sort();
  const q = sp.q?.toLowerCase().trim();
  const filtered = rows.filter((p) => {
    if (sp.state === "live" && !p.published) return false;
    if (sp.state === "draft" && p.published) return false;
    if (sp.category && p.category !== sp.category) return false;
    if (q && !`${p.title} ${p.slug} ${p.excerpt}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <>
      <PageHeading
        title="Journal"
        description="Posts are the store's organic traffic. Each gets a canonical URL, an OG card and Article structured data."
        action={
          <LinkButton href="/admin/journal/new" variant="primary">
            New post
          </LinkButton>
        }
      />

      {sp.saved && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-[0.85rem] text-success">
          Saved and live on the storefront.
        </div>
      )}

      <Card className="mb-4" padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <SearchInput placeholder="Title, slug or excerpt…" />
          <FilterSelect
            paramName="state"
            label="Filter by state"
            allLabel="All states"
            options={[
              { value: "live", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
          />
          <FilterSelect
            paramName="category"
            label="Filter by category"
            allLabel="All categories"
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <span className="ml-auto text-[0.78rem] text-panel-muted">
            {filtered.length} of {rows.length} posts
          </span>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="No posts match"
          description="Try clearing the filters, or write something new."
          action={<LinkButton href="/admin/journal/new" variant="primary">New post</LinkButton>}
        />
      ) : (
        <Table minWidth="46rem">
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Read</Th>
              <Th>State</Th>
              <Th>Published</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((post) => (
              <tr key={post.id}>
                <Td>
                  <Link
                    href={`/admin/journal/${post.id}`}
                    className="font-medium text-panel-ink transition-colors hover:text-green-700"
                  >
                    {post.title}
                  </Link>
                  <span className="block truncate text-[0.72rem] text-panel-muted">
                    /{post.slug}
                  </span>
                </Td>
                <Td>{post.category}</Td>
                <Td>{post.readMinutes} min</Td>
                <Td>
                  <Badge tone={post.published ? "success" : "neutral"} dot>
                    {post.published ? "Live" : "Draft"}
                  </Badge>
                </Td>
                <Td>{post.publishedAt?.toLocaleDateString("en-GB") ?? "—"}</Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-3">
                    {post.published && (
                      <Link
                        href={`/journal/${post.slug}`}
                        target="_blank"
                        className="text-[0.76rem] text-panel-muted transition-colors hover:text-green-700"
                      >
                        View ↗
                      </Link>
                    )}
                    <Link
                      href={`/admin/journal/${post.id}`}
                      className="text-[0.76rem] font-medium text-green-700 transition-colors hover:text-green-900"
                    >
                      Edit
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
