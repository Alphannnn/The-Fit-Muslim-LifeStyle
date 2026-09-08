import Link from "next/link";
import ActionButton from "@/components/admin/ui/ActionButton";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeading,
  Table,
  Td,
  Th,
} from "@/components/admin/ui/primitives";
import Stars from "@/components/ui/Stars";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, reviews } from "@/lib/db/schema";
import { moderateReviewAction } from "@/lib/admin/actions";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const rows = await db
    .select({ review: reviews, product: products })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .orderBy(desc(reviews.createdAt))
    .all();

  const pending = rows.filter((r) => !r.review.approved);
  const live = rows.filter((r) => r.review.approved);

  return (
    <>
      <PageHeading
        title="Reviews"
        description="Verified buyers publish immediately. Everyone else waits here for a decision."
      />

      <Card className="mb-4">
        <CardHeader
          title={`Awaiting moderation (${pending.length})`}
          description="Approving publishes the review on the product page straight away."
        />
        {pending.length === 0 ? (
          <EmptyState title="Nothing waiting" description="Every review has been dealt with." />
        ) : (
          <ul className="space-y-3">
            {pending.map(({ review, product }) => (
              <li
                key={review.id}
                className="rounded-lg border border-warning/30 bg-warning-soft/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Stars value={review.rating} id={review.id} />
                      <span className="text-[0.85rem] font-semibold text-panel-ink">
                        {review.authorName}
                      </span>
                      <Link
                        href={`/product/${product.slug}`}
                        target="_blank"
                        className="text-[0.76rem] text-green-700 transition-colors hover:text-green-900"
                      >
                        {product.name} ↗
                      </Link>
                      <span className="text-[0.74rem] text-panel-muted">
                        {review.createdAt.toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    {review.title && (
                      <p className="mt-2 text-[0.9rem] font-medium text-panel-ink">
                        {review.title}
                      </p>
                    )}
                    <p className="mt-1 max-w-2xl text-[0.85rem] leading-relaxed text-panel-soft">
                      {review.body}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <ActionButton
                      action={moderateReviewAction.bind(null, review.id, true)}
                      success="Review approved and published"
                      variant="primary"
                    >
                      Approve
                    </ActionButton>
                    <ActionButton
                      action={moderateReviewAction.bind(null, review.id, false)}
                      confirm="Delete this review permanently?"
                      success="Review deleted"
                      variant="danger"
                    >
                      Delete
                    </ActionButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title={`Published (${live.length})`} />
        </div>
        {live.length === 0 ? (
          <div className="p-5 pt-0">
            <EmptyState title="No published reviews yet" />
          </div>
        ) : (
          <Table minWidth="40rem">
            <thead>
              <tr>
                <Th>Rating</Th>
                <Th>Author</Th>
                <Th>Product</Th>
                <Th>Review</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {live.map(({ review, product }) => (
                <tr key={review.id}>
                  <Td>
                    <Stars value={review.rating} id={review.id} />
                  </Td>
                  <Td>
                    <span className="font-medium text-panel-ink">{review.authorName}</span>
                    {review.verifiedPurchase && <Badge tone="success">verified</Badge>}
                  </Td>
                  <Td>{product.name}</Td>
                  <Td>
                    <span className="block max-w-[22rem] truncate text-[0.82rem]">
                      {review.title || review.body}
                    </span>
                  </Td>
                  <Td align="right">
                    <ActionButton
                      action={moderateReviewAction.bind(null, review.id, false)}
                      confirm="Remove this published review?"
                      success="Review removed"
                    >
                      Remove
                    </ActionButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
