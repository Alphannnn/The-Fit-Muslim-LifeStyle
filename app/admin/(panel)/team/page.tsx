import InviteForm from "@/components/admin/InviteForm";
import RoleSelect from "@/components/admin/RoleSelect";
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
import { listSessionsFor, requireFullAdmin } from "@/lib/admin/auth";
import {
  revokeInviteAction,
  revokeOwnSessionAction,
  revokeStaffSessionsAction,
} from "@/lib/admin/auth-actions";
import { inviteStatus, listInvites } from "@/lib/admin/invites";
import { listStaff } from "@/lib/admin/queries";

export const metadata = { title: "Team" };

const INVITE_TONE = {
  pending: "info",
  accepted: "success",
  revoked: "neutral",
  expired: "warning",
} as const;

export default async function AdminTeamPage() {
  const me = await requireFullAdmin("/admin/team");
  const [staff, invites, mySessions] = await Promise.all([
    listStaff(),
    listInvites(),
    listSessionsFor(me.id),
  ]);

  const pending = invites.filter((i) => inviteStatus(i) === "pending");
  const past = invites.filter((i) => inviteStatus(i) !== "pending");

  return (
    <>
      <PageHeading
        title="Team"
        description="Staff accounts are invite-only — there is no admin sign-up form anywhere on the site."
      />

      <Card className="mb-4">
        <CardHeader
          title="Invite someone"
          description="Creates a one-time link. Send it to them yourself — nothing is emailed automatically."
        />
        <InviteForm />
      </Card>

      <Card className="mb-4" padded={false}>
        <div className="p-5 pb-3">
          <CardHeader title="Staff" description={`${staff.length} with access`} />
        </div>
        <Table minWidth="42rem">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Joined</Th>
              <Th>Role</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => {
              const isMe = member.id === me.id;
              return (
                <tr key={member.id}>
                  <Td>
                    <span className="font-medium text-panel-ink">{member.name}</span>
                    {isMe && <Badge tone="brand">you</Badge>}
                  </Td>
                  <Td>{member.email}</Td>
                  <Td>{member.createdAt.toLocaleDateString("en-GB")}</Td>
                  <Td>
                    <RoleSelect
                      userId={member.id}
                      role={member.role}
                      name={member.name}
                      disabled={isMe}
                    />
                  </Td>
                  <Td align="right">
                    {!isMe && (
                      <ActionButton
                        action={revokeStaffSessionsAction.bind(null, member.id)}
                        confirm={`Sign ${member.name} out of every device?`}
                        success={`${member.name} has been signed out everywhere`}
                      >
                        Sign out everywhere
                      </ActionButton>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <p className="px-5 py-3 text-[0.74rem] text-panel-muted">
          You cannot change your own role, and the last remaining admin cannot be demoted.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false}>
          <div className="p-5 pb-3">
            <CardHeader title="Pending invitations" description={`${pending.length} outstanding`} />
          </div>
          {pending.length === 0 ? (
            <div className="p-5 pt-0">
              <EmptyState title="No pending invitations" />
            </div>
          ) : (
            <Table minWidth="28rem">
              <thead>
                <tr>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Expires</Th>
                  <Th align="right" />
                </tr>
              </thead>
              <tbody>
                {pending.map((invite) => (
                  <tr key={invite.id}>
                    <Td className="font-medium text-panel-ink">{invite.email}</Td>
                    <Td className="capitalize">{invite.role}</Td>
                    <Td>{invite.expiresAt.toLocaleDateString("en-GB")}</Td>
                    <Td align="right">
                      <ActionButton
                        action={revokeInviteAction.bind(null, invite.id)}
                        confirm={`Revoke the invitation for ${invite.email}?`}
                        success="Invitation revoked"
                        variant="ghost"
                      >
                        Revoke
                      </ActionButton>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Your active sessions"
            description="Every device currently signed in as you."
          />
          {mySessions.length === 0 ? (
            <p className="text-[0.83rem] text-panel-muted">No other sessions.</p>
          ) : (
            <ul className="space-y-2">
              {mySessions.map((session) => (
                <li
                  key={session.tokenHash}
                  className="flex items-start justify-between gap-3 rounded-md border border-panel-border px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.8rem] text-panel-ink">
                      {session.userAgent?.split(")")[0]?.replace(/^Mozilla\/[\d.]+ \(/, "") ??
                        "Unknown device"}
                    </p>
                    <p className="text-[0.72rem] text-panel-muted">
                      {session.ip ?? "unknown IP"} · expires{" "}
                      {session.expiresAt.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <ActionButton
                    action={revokeOwnSessionAction.bind(null, session.tokenHash)}
                    success="Session ended"
                    variant="ghost"
                  >
                    End
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {past.length > 0 && (
        <Card className="mt-4" padded={false}>
          <div className="p-5 pb-3">
            <CardHeader title="Invitation history" />
          </div>
          <Table minWidth="34rem">
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Issued</Th>
              </tr>
            </thead>
            <tbody>
              {past.map((invite) => {
                const status = inviteStatus(invite);
                return (
                  <tr key={invite.id}>
                    <Td>{invite.email}</Td>
                    <Td className="capitalize">{invite.role}</Td>
                    <Td>
                      <Badge tone={INVITE_TONE[status]}>{status}</Badge>
                    </Td>
                    <Td>{invite.createdAt.toLocaleDateString("en-GB")}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
