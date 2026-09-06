import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createSiteEnrollment } from "@/actions/admin";
import { ROLE_LABELS, type Role } from "@/lib/constants";

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

  return (
    <div>
      <PageHeader title={account.name} description={`${account.tier} tier`} />
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
                </tr>
              </THead>
              <TBody>
                {account.siteEnrollments.length === 0 && <EmptyRow colSpan={3} message="Not enrolled at any facility yet." />}
                {account.siteEnrollments.map((e) => (
                  <TR key={e.id}>
                    <TD>{e.facility.name}</TD>
                    <TD>{e.spaceRef ?? "—"}</TD>
                    <TD>{e.status}</TD>
                  </TR>
                ))}
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
                </tr>
              </THead>
              <TBody>
                {account.users.length === 0 && <EmptyRow colSpan={3} message="No users yet — add one from Admin → Users." />}
                {account.users.map((u) => (
                  <TR key={u.id}>
                    <TD>{u.name}</TD>
                    <TD>{u.email}</TD>
                    <TD>
                      <Badge>{ROLE_LABELS[u.role as Role] ?? u.role}</Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
