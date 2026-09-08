"use client";

import { useActionState, useState } from "react";
import { createInviteAction, type AdminAuthState } from "@/lib/admin/auth-actions";
import { buttonClass } from "./ui/primitives";
import { useToast } from "./ui/Toast";

const initial: AdminAuthState & { url?: string } = {};

export default function InviteForm() {
  const [state, action, pending] = useActionState(createInviteAction, initial);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.push("Invitation link copied", "success");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.push("Couldn't copy — select the link and copy it manually.", "error");
    }
  }

  return (
    <div>
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
        <div>
          <label htmlFor="invite-email" className="admin-label">
            Email address
          </label>
          <input
            id="invite-email"
            type="email"
            name="email"
            required
            placeholder="name@thefitmuslim.co"
            className="admin-field"
          />
        </div>
        <div>
          <label htmlFor="invite-role" className="admin-label">
            Role
          </label>
          <select id="invite-role" name="role" defaultValue="coach" className="admin-field cursor-pointer">
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={pending} className={`${buttonClass("primary")} w-full`}>
            {pending ? "Creating…" : "Create invite"}
          </button>
        </div>
      </form>

      <p className="mt-2 text-[0.74rem] leading-relaxed text-panel-muted">
        A coach can review plans and manage content. An admin can additionally manage the
        team and see the activity log.
      </p>

      {state.error && (
        <p className="mt-3 rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[0.82rem] text-danger">
          {state.error}
        </p>
      )}

      {state.ok && state.url && (
        <div className="mt-4 rounded-md border border-success/30 bg-success-soft p-4">
          <p className="text-[0.82rem] font-medium text-success">
            Invitation created — copy this link and send it to them.
          </p>
          <p className="mt-1 text-[0.74rem] text-success/80">
            It works once, expires in seven days, and is shown only now.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded border border-success/25 bg-white px-3 py-2 font-mono text-[0.74rem] text-panel-ink">
              {state.url}
            </code>
            <button
              type="button"
              onClick={() => copy(state.url!)}
              className={buttonClass("secondary", "sm")}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
