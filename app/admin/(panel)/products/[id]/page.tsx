import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import ProductForm from "@/components/admin/ProductForm";
import { PageHeading } from "@/components/admin/ui/primitives";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  const product = isNew
    ? undefined
    : ((await db.select().from(products).where(eq(products.id, id)).get()) ?? undefined);

  if (!isNew && !product) notFound();

  return (
    <>
      <PageHeading
        breadcrumb={[
          { label: "Products", href: "/admin/products" },
          { label: isNew ? "New" : product!.name },
        ]}
        title={isNew ? "New product" : product!.name}
        description={
          isNew
            ? "Everything here is live the moment you save — the shop and home page revalidate immediately."
            : `/${product!.slug}`
        }
      />
      <ProductForm product={product} />
    </>
  );
}
