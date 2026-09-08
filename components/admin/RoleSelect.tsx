"use client";

import { useTransition } from "react";
import { changeRoleAction } from "@/lib/admin/auth-actions";
import type { UserRole } from "@/lib/db/schema";
import { useToast } from "./ui/Toast";

/** Changing someone to `customer` revokes their admin sessions immediately. */
export default function RoleSelect({
  userId,
  role,
  name,
  disabled,
}: {
  userId: string;
  role: UserRole;
  name: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <select
      value={role}
      disabled={disabled || pending}
      aria-label={`Role for ${name}`}
      onChange={(e) => {
        const next = e.target.value as UserRole;
        if (
          next === "customer" &&
          !window.confirm(`Remove ${name}'s staff access? They will be signed out immediately.`)
        ) {
          return;
        }
        startTransition(async () => {
          try {
            await changeRoleAction(userId, next);
            toast.push(`${name} is now ${next}`, "success");
          } catch (error) {
            toast.push(
              error instanceof Error ? error.message : "Couldn't change that role.",
              "error",
            );
          }
        });
      }}
      className="admin-field w-auto cursor-pointer py-1.5 text-[0.78rem] disabled:cursor-not-allowed"
    >
      <option value="admin">Admin</option>
      <option value="coach">Coach</option>
      <option value="customer">Remove access</option>
    </select>
  );
}
