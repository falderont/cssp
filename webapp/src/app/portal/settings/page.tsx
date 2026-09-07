import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamTable } from "@/components/portal/team-table";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import { inviteTenantUser } from "@/actions/tenant";
import { ROLE_LABELS, ROLES, TENANT_ROLES } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

export default async function PortalSettingsPage() {
  const user = await requireCustomerUser();
  const isGlobalAdmin = user.role === ROLES.TENANT_GLOBAL_ADMIN;
  const [account, users, enrollments] = await Promise.all([
    prisma.enterpriseAccount.findUnique({ where: { id: user.enterpriseAccountId } }),
    prisma.user.findMany({ where: { enterpriseAccountId: user.enterpriseAccountId }, include: { restrictedFacility: true }, orderBy: { name: "asc" } }),
    getCustomerSiteEnrollments(user),
  ]);

  return (
    <div>
      <PageHeader title="Team & settings" description={account?.name} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Team ({users.length})</CardTitle>
            </CardHeader>
            <TeamTable users={users} isGlobalAdmin={isGlobalAdmin} currentUserId={user.id} />
          </Card>
        </div>

        {isGlobalAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Invite teammate</CardTitle>
            </CardHeader>
            <CardBody>
              <ActionForm action={inviteTenantUser} className="space-y-3">
                <Field label="Full name" htmlFor="name" required>
                  <Input id="name" name="name" required />
                </Field>
                <Field label="Work email" htmlFor="email" required>
                  <Input id="email" name="email" type="email" required />
                </Field>
                <Field label="Temporary password" htmlFor="password" required hint="At least 8 characters">
                  <Input id="password" name="password" defaultValue="password123" required minLength={8} />
                </Field>
                <Field label="Role" htmlFor="role" required>
                  <Select id="role" name="role" required defaultValue={ROLES.TENANT_TECH_USER}>
                    {TENANT_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Restrict to one site (optional)" htmlFor="restrictedFacilityId" hint="Required in practice for a Site Lead">
                  <Select id="restrictedFacilityId" name="restrictedFacilityId" defaultValue="">
                    <option value="">All enrolled sites</option>
                    {enrollments.map((e) => (
                      <option key={e.facilityId} value={e.facilityId}>
                        {e.facility.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button type="submit" className="w-full">
                  Send invite
                </Button>
              </ActionForm>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
