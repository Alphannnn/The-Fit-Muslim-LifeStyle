"use client";

import { useTransition, type ReactNode } from "react";
import { buttonClass } from "./primitives";
import { useToast } from "./Toast";

/**
 * Runs a bound server action and reports the outcome as a toast. Used for the
 * row-level actions that change something and then stay on the same page.
 */
export default function ActionButton({
  action,
  children,
  success,
  confirm,
  variant = "ghost",
  size = "sm",
  className = "",
  title,
}: {
  action: () => Promise<unknown>;
  children: ReactNode;
  success?: string;
  /** when set, the click must be confirmed first */
  confirm?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
  title?: string;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      className={`${buttonClass(variant, size)} ${className}`}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          try {
            await action();
            if (success) toast.push(success, "success");
          } catch (error) {
            toast.push(
              error instanceof Error ? error.message : "That didn't work. Please try again.",
              "error",
            );
          }
        });
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
