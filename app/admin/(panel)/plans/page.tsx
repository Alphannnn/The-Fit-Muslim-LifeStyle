import Link from "next/link";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  LinkButton,
  PageHeading,
  Table,
  Td,
  Th,
} from "@/components/admin/ui/primitives";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { planIntakes, plans, users } from "@/lib/db/schema";

export const metadata = { title: "Plan queue" };

export default async function PlanQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string }>;
}) {
  const [{ approved }, rows] = await Promise.all([
    searchParams,
    db
      .select({ plan: plans, intake: planIntakes, customer: users })
      .from(plans)
      .innerJoin(planIntakes, eq(planIntakes.id, plans.intakeId))
      .innerJoin(users, eq(users.id, plans.userId))
      .orderBy(desc(plans.createdAt))
      .all(),
  ]);

  const queue = rows.filter((r) => r.plan.status === "draft");
  const done = rows.filter((r) => r.plan.status !== "draft");

  return (
    <>
      <PageHeading
        title="Plan queue"
        description="Drafts are generated automatically. Nothing reaches a customer until a coach approves it."
      />

      {approved && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-[0.85rem] text-success">
          Plan approved and delivered — the customer has been emailed.
        </div>
      )}

      <Card className="mb-4">
        <CardHeader
          title={`Awaiting review (${queue.length})`}
          description="Read the medical note before approving anything flagged."
        />

        {queue.length === 0 ? (
          <EmptyState
            title="Nothing waiting"
            description="Every submitted plan has been reviewed and delivered."
          />
        ) : (
          <ul className="space-y-3">
            {queue.map(({ plan, intake, customer }) => (
              <li
                key={plan.id}
                className="rounded-lg border border-warning/30 bg-warning-soft/40 p-4 transition-colors hover:border-warning/60"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-[0.95rem] font-semibold text-panel-ink transition-colors hover:text-green-700"
                      >
                        {customer.name}
                      </Link>
                      <Badge tone="neutral">{intake.status.replace("_", " ")}</Badge>
                      {intake.ramadanMode && <Badge tone="success">Ramadan</Badge>}
                      {intake.medical.trim() && <Badge tone="danger">Medical note</Badge>}
                      {intake.fastsMondayThursday && <Badge tone="brand">Mon/Thu fasts</Badge>}
                    </div>

                    <p className="mt-1 text-[0.74rem] text-panel-muted">
                      {customer.email} · submitted{" "}
                      {plan.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                    <p className="mt-2.5 text-[0.83rem] capitalize text-panel-soft">
                      {intake.goal} · {intake.sex}, {intake.age} · {intake.weightKg}kg /{" "}
                      {intake.heightCm}cm · {intake.activityLevel} ·{" "}
                      {intake.trainingDaysPerWeek} days · {intake.dietaryStyle}
                      {intake.allergies.length > 0 && (
                        <span className="text-danger"> · avoids {intake.allergies.join(", ")}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-[1.15rem] font-semibold text-panel-ink">
                        {plan.targetCalories}
                      </p>
                      <p className="text-[0.66rem] uppercase tracking-[0.1em] text-panel-muted">
                        kcal
                      </p>
                    </div>
                    <LinkButton href={`/admin/plans/${plan.id}`} variant="primary">
                      Review
                    </LinkButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title={`Delivered (${done.length})`} />
        </div>
        {done.length === 0 ? (
          <div className="p-5 pt-0">
            <EmptyState title="Nothing delivered yet" />
          </div>
        ) : (
          <Table minWidth="40rem">
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Plan</Th>
                <Th align="right">Calories</Th>
                <Th>Delivered</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {done.map(({ plan, customer }) => (
                <tr key={plan.id}>
                  <Td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-panel-ink transition-colors hover:text-green-700"
                    >
                      {customer.name}
                    </Link>
                    <span className="block truncate text-[0.72rem] text-panel-muted">
                      {customer.email}
                    </span>
                  </Td>
                  <Td>
                    {plan.title}
                    <span className="block text-[0.72rem] text-panel-muted">v{plan.version}</span>
                  </Td>
                  <Td align="right">{plan.targetCalories}</Td>
                  <Td>{plan.deliveredAt?.toLocaleDateString("en-GB") ?? "—"}</Td>
                  <Td align="right">
                    <Link
                      href={`/admin/plans/${plan.id}`}
                      className="text-[0.76rem] font-medium text-green-700 transition-colors hover:text-green-900"
                    >
                      View
                    </Link>
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
