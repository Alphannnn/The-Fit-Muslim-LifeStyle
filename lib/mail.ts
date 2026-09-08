import { getDb } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

/* Every send is written to email_log regardless of transport, so order
   confirmations and plan-ready notices are auditable in dev — where there
   is no provider — as well as in production. */

export type Mail = { to: string; subject: string; body: string };

async function sendViaResend(mail: Mail, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "The Fit Muslim <hello@thefitmuslim.com>",
        to: [mail.to],
        subject: mail.subject,
        text: mail.body,
      }),
    });
    if (!res.ok) console.error("[mail] resend rejected the send:", await res.text());
    return res.ok;
  } catch (error) {
    console.error("[mail] resend unreachable:", error);
    return false;
  }
}

export async function sendMail(mail: Mail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  let provider = "console";

  if (apiKey) {
    provider = (await sendViaResend(mail, apiKey)) ? "resend" : "resend-failed";
  } else if (process.env.NODE_ENV !== "production") {
    console.log(`\n[mail → ${mail.to}] ${mail.subject}\n${mail.body}\n`);
  }

  const db = await getDb();
  await db.insert(emailLog).values({
    id: newId(),
    to: mail.to,
    subject: mail.subject,
    body: mail.body,
    provider,
  });
}

/* ----------------------------- templates ----------------------------- */

export function orderConfirmationMail(input: {
  to: string;
  name?: string | null;
  orderNumber: string;
  total: string;
  lines: { name: string; qty: number }[];
  orderUrl: string;
}): Mail {
  const items = input.lines.map((l) => `  · ${l.name} × ${l.qty}`).join("\n");
  return {
    to: input.to,
    subject: `Order ${input.orderNumber} confirmed — The Fit Muslim`,
    body: `As-salāmu ʿalaykum${input.name ? ` ${input.name}` : ""},

Your order is confirmed and paid. Jazāk Allāhu khayran.

Order ${input.orderNumber}
${items}

Total: ${input.total}

Track it here: ${input.orderUrl}

Faith · Discipline · Strength
The Fit Muslim`,
  };
}

export function planReadyMail(input: {
  to: string;
  name?: string | null;
  planTitle: string;
  planUrl: string;
  coachNote?: string;
}): Mail {
  return {
    to: input.to,
    subject: "Your plan has been approved — The Fit Muslim",
    body: `As-salāmu ʿalaykum${input.name ? ` ${input.name}` : ""},

Your coach has reviewed and approved your plan: ${input.planTitle}.
${input.coachNote ? `\nA note from your coach:\n"${input.coachNote}"\n` : ""}
Open it here: ${input.planUrl}

Start with the next meal, not tomorrow.

Faith · Discipline · Strength
The Fit Muslim`,
  };
}

export function intakeReceivedMail(input: {
  to: string;
  name?: string | null;
}): Mail {
  return {
    to: input.to,
    subject: "We've got your intake — your plan is being built",
    body: `As-salāmu ʿalaykum${input.name ? ` ${input.name}` : ""},

Your intake is in and a first draft of your plan has already been generated.
A coach now reviews it — you'll hear from us within 48 hours, and nothing
reaches you until it's approved.

Faith · Discipline · Strength
The Fit Muslim`,
  };
}
