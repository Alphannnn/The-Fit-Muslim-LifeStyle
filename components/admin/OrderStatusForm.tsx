"use client";

import { buttonClass } from "./ui/primitives";

import { useActionState } from "react";
import { updateOrderAction, type AdminState } from "@/lib/admin/actions";
import type { OrderStatus } from "@/lib/db/schema";

const initial: AdminState = {};

const STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled", "refunded"];

export default function OrderStatusForm({
  orderId,
  status,
  trackingNumber,
}: {
  orderId: string;
  status: OrderStatus;
  trackingNumber: string | null;
}) {
  const [state, action, pending] = useActionState(updateOrderAction, initial);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />

      <select
        name="status"
        defaultValue={status}
        className="admin-field w-auto cursor-pointer capitalize"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <input
        name="trackingNumber"
        defaultValue={trackingNumber ?? ""}
        placeholder="Tracking no."
        className="admin-field w-44"
      />

      <button
        type="submit"
        disabled={pending}
        className={buttonClass("primary", "sm")}
      >
        {pending ? "…" : "Update"}
      </button>

      {state.ok && <span className="text-[0.78rem] font-medium text-success">Saved</span>}
      {state.error && <span className="text-[0.78rem] font-medium text-danger">{state.error}</span>}
    </form>
  );
}
