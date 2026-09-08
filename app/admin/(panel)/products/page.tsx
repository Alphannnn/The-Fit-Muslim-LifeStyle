import Link from "next/link";
import ActionButton from "@/components/admin/ui/ActionButton";
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
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { toggleProductActiveAction } from "@/lib/admin/actions";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; q?: string; kind?: string; state?: string }>;
}) {
  const [sp, rows] = await Promise.all([
    searchParams,
    db.select().from(products).orderBy(products.position, products.name).all(),
  ]);

  /* The catalogue is small enough to filter in memory; when it outgrows that
     this becomes a query like the orders list. */
  const q = sp.q?.toLowerCase().trim();
  const filtered = rows.filter((p) => {
    if (sp.kind && p.kind !== sp.kind) return false;
    if (sp.state === "live" && !p.active) return false;
    if (sp.state === "hidden" && p.active) return false;
    if (sp.state === "low" && !(p.stock !== null && p.stock <= 12)) return false;
    if (q && !`${p.name} ${p.subtitle} ${p.slug}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <>
      <PageHeading
        title="Products"
        description="The catalogue. Saving revalidates the shop, the product page and the home page immediately."
        action={
          <LinkButton href="/admin/products/new" variant="primary">
            New product
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
          <SearchInput placeholder="Name, subtitle or slug…" />
          <FilterSelect
            paramName="kind"
            label="Filter by kind"
            allLabel="All kinds"
            options={[
              { value: "physical", label: "Physical" },
              { value: "digital", label: "Digital" },
              { value: "subscription", label: "Subscription" },
            ]}
          />
          <FilterSelect
            paramName="state"
            label="Filter by state"
            allLabel="All states"
            options={[
              { value: "live", label: "Live" },
              { value: "hidden", label: "Hidden" },
              { value: "low", label: "Low stock" },
            ]}
          />
          <span className="ml-auto text-[0.78rem] text-panel-muted">
            {filtered.length} of {rows.length} products
          </span>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="No products match"
          description="Try clearing the filters, or add a new product."
          action={<LinkButton href="/admin/products/new" variant="primary">New product</LinkButton>}
        />
      ) : (
        <Table minWidth="56rem">
          <thead>
            <tr>
              <Th width="3.5rem" />
              <Th>Product</Th>
              <Th>Kind</Th>
              <Th align="right">Price</Th>
              <Th>Stock</Th>
              <Th>Halal</Th>
              <Th>State</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id}>
                <Td>
                  <div className="grid h-11 w-9 place-items-center overflow-hidden rounded-md border border-panel-border bg-panel">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image} alt="" className="h-full w-full object-contain p-1" />
                  </div>
                </Td>
                <Td>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="font-medium text-panel-ink transition-colors hover:text-green-700"
                  >
                    {product.name}
                  </Link>
                  <span className="block truncate text-[0.72rem] text-panel-muted">
                    {product.subtitle} · /{product.slug}
                  </span>
                </Td>
                <Td className="capitalize">{product.kind}</Td>
                <Td align="right">
                  <span className="font-semibold text-panel-ink">
                    {formatMoney(product.priceCents, product.currency)}
                  </span>
                  {product.compareAtCents && (
                    <span className="block text-[0.72rem] text-panel-muted line-through">
                      {formatMoney(product.compareAtCents, product.currency)}
                    </span>
                  )}
                </Td>
                <Td>
                  {product.stock === null ? (
                    <span className="text-panel-muted">Not tracked</span>
                  ) : product.stock <= 0 ? (
                    <Badge tone="danger">Out</Badge>
                  ) : product.stock <= 12 ? (
                    <Badge tone="warning">{product.stock} left</Badge>
                  ) : (
                    <span>{product.stock}</span>
                  )}
                </Td>
                <Td>
                  {product.halalStatus === "certified" ? (
                    <Badge tone="success">{product.halalAuthority ?? "Certified"}</Badge>
                  ) : product.halalStatus === "verified-ingredients" ? (
                    <Badge tone="brand">Verified</Badge>
                  ) : (
                    <span className="text-panel-muted">—</span>
                  )}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={product.active ? "success" : "neutral"} dot>
                      {product.active ? "Live" : "Hidden"}
                    </Badge>
                    {product.featured && <Badge tone="brand">Featured</Badge>}
                  </div>
                </Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-1">
                    <ActionButton
                      action={toggleProductActiveAction.bind(null, product.id)}
                      success={`${product.name} ${product.active ? "hidden" : "published"}`}
                    >
                      {product.active ? "Hide" : "Publish"}
                    </ActionButton>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="px-2 text-[0.76rem] font-medium text-green-700 transition-colors hover:text-green-900"
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
