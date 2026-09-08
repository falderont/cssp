import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Button, LinkButton } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createSiteEnrollment, updateAccountStatus, updateSiteEnrollmentStatus } from "@/actions/admin";
import { ENTERPRISE_ACCOUNT_STATUSES, ROLE_LABELS, SITE_ENROLLMENT_STATUSES, type Role } from "@/lib/constants";

export default async function AccountDetailPage({ params }: { params: { id: string } }) {
  await requireSysAdmin();
  const account = await prisma.enterpriseAccount.findUnique({
    where: { id: params.id },
    include: {
      siteEnrollments: { include: { facility: true } },
      users: { orderBy: { name: "asc" } },
    },
  });
  if (!account) notFound();

  const facilities = await prisma.facility.findMany({ orderBy: { name: "asc" } });
  const enrollBound = createSiteEnrollment.bind(null, account.id);
  const updateAccountStatusBound = updateAccountStatus.bind(null, account.id);

  return (
    <div>
      <PageHeader
        title={account.name}
        description={`${account.tier} tier`}
        actions={<StatusBadge status={account.status} />}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Site enrollments</CardTitle>
            </CardHeader>
            <Table>
              <THead>
                <tr>
                  <TH>Facility</TH>
                  <TH>Space</TH>
                  <TH>Status</TH>
                  <TH>Change status</TH>
                </tr>
              </THead>
              <TBody>
                {account.siteEnrollments.length === 0 && <EmptyRow colSpan={4} message="Not enrolled at any facility yet." />}
                {account.siteEnrollments.map((e) => {
                  const updateStatusBound = updateSiteEnrollmentStatus.bind(null, e.id);
                  return (
                    <TR key={e.id}>
                      <TD>{e.facility.name}</TD>
                      <TD>{e.spaceRef ?? "—"}</TD>
                      <TD>
                        <StatusBadge status={e.status} />
                      </TD>
                      <TD>
                        <form action={updateStatusBound} className="flex items-center gap-2">
                          <Select name="status" defaultValue={e.status} className="!w-auto py-1 text-xs">
                            {SITE_ENROLLMENT_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </Select>
                          <Button type="submit" size="sm" variant="ghost">
                            Update
                          </Button>
                        </form>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <CardBody className="border-t border-slate-100">
              <form action={enrollBound} className="flex flex-wrap items-end gap-3">
                <div className="flex-1">
                  <Field label="Facility" htmlFor="facilityId" required>
                    <Select id="facilityId" name="facilityId" required>
                      {facilities.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Space reference (optional)" htmlFor="spaceRef">
                    <Input id="spaceRef" name="spaceRef" placeholder="e.g. Cage 7, Rack C14-18" />
                  </Field>
                </div>
                <Button type="submit">Enroll site</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <Table>
              <THead>
                <tr>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Status</TH>
                  <TH>Actions</TH>
                </tr>
              </THead>
              <TBody>
                {account.users.length === 0 && <EmptyRow colSpan={5} message="No users yet — add one from Admin → Users." />}
                {account.users.map((u) => (
                  <TR key={u.id}>
                    <TD>{u.name}</TD>
                    <TD>{u.email}</TD>
                    <TD>
                      <Badge>{ROLE_LABELS[u.role as Role] ?? u.role}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "Active" : "Disabled"}</Badge>
                    </TD>
                    <TD>
                      <LinkButton href={`/ops/admin/users/${u.id}`} size="sm" variant="ghost">
                        Edit
                      </LinkButton>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account status</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="mb-3 text-xs text-slate-500">
              Suspending or terminating blocks login for every user on this account, at every enrolled site. Site
              enrollments, users, documents and invoices are kept — nothing is deleted.
            </p>
            <form action={updateAccountStatusBound} className="space-y-3">
              <Field label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={account.status}>
                  {ENTERPRISE_ACCOUNT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button type="submit" className="w-full" variant="secondary">
                Update status
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
