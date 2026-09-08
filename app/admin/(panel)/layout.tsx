import { count, eq, inArray } from "drizzle-orm";
import AdminShell from "@/components/admin/AdminShell";
import ToastProvider from "@/components/admin/ui/Toast";
import { db } from "@/lib/db";
import { orders, plans, reviews } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/auth";

/* Counts drive the badges in the sidebar, so what needs attention is visible
   from any screen rather than only on the dashboard. */
async function attentionCounts() {
  const [draftPlans, pendingReviews, unfulfilled] = await Promise.all([
    db.select({ n: count() }).from(plans).where(eq(plans.status, "draft")).get(),
    db.select({ n: count() }).from(reviews).where(eq(reviews.approved, false)).get(),
    db.select({ n: count() }).from(orders).where(inArray(orders.status, ["paid"])).get(),
  ]);
  return {
    plans: draftPlans?.n ?? 0,
    reviews: pendingReviews?.n ?? 0,
    orders: unfulfilled?.n ?? 0,
  };
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const badges = await attentionCounts();

  return (
    <ToastProvider>
      <AdminShell
        user={{ name: user.name, email: user.email, role: user.role }}
        badges={badges}
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
