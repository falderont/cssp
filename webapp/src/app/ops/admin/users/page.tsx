import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton, Button } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toggleUserActive } from "@/actions/admin";
import { CS_SCOPE_LABELS, ROLE_LABELS, isInternalRole, type Role } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

export default async function UsersPage() {
  await requireSysAdmin();
  const users = await prisma.user.findMany({
    include: { enterpriseAccount: true, restrictedFacility: true, restrictedRegion: true, restrictedCountry: true, team: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Everyone who can sign in — every internal persona and every tenant persona."
        actions={
          <LinkButton href="/ops/admin/users/new">
            <Plus className="h-4 w-4" /> Add user
          </LinkButton>
        }
      />
      <Table>
        <THead>
          <tr>
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Role</TH>
            <TH>Scope</TH>
            <TH>Status</TH>
            <TH>Actions</TH>
          </tr>
        </THead>
        <TBody>
          {users.length === 0 && <EmptyRow colSpan={6} message="No users yet." />}
          {users.map((u) => {
            const toggleBound = toggleUserActive.bind(null, u.id, "/ops/admin/users");
            return (
              <TR key={u.id}>
                <TD className="font-medium text-slate-900">{u.name}</TD>
                <TD>{u.email}</TD>
                <TD>
                  <Badge tone={isInternalRole(u.role) ? "blue" : "slate"}>{ROLE_LABELS[u.role as Role] ?? u.role}</Badge>
                </TD>
                <TD>
                  {[
                    u.enterpriseAccount?.name,
                    u.csScope ? (CS_SCOPE_LABELS[u.csScope as keyof typeof CS_SCOPE_LABELS] ?? u.csScope) : null,
                    u.restrictedRegion ? `Region: ${u.restrictedRegion.name}` : null,
                    u.restrictedCountry ? `Country: ${u.restrictedCountry.name}` : null,
                    u.restrictedFacility ? `${u.restrictedFacility.name} only` : null,
                    u.team ? `Team: ${u.team.name}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </TD>
                <TD>
                  <Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "Active" : "Disabled"}</Badge>
                </TD>
                <TD>
                  <div className="flex items-center gap-1.5">
                    <LinkButton href={`/ops/admin/users/${u.id}`} size="sm" variant="ghost">
                      Edit
                    </LinkButton>
                    <ActionForm action={toggleBound} silent>
                      <Button type="submit" size="sm" variant="ghost">
                        {u.isActive ? "Disable" : "Enable"}
                      </Button>
                    </ActionForm>
                  </div>
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
