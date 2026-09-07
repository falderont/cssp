import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createControlledArea, createSiteEnrollment, updateEnterpriseAccount } from "@/actions/admin";
import { ROLE_LABELS, type Role } from "@/lib/constants";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSysAdmin();
  const account = await prisma.enterpriseAccount.findUnique({
    where: { id },
    include: {
      siteEnrollments: {
        include: {
          facility: { include: { buildings: { include: { rooms: true } } } },
          controlledAreas: { include: { building: true, room: true } },
        },
      },
      users: { orderBy: { name: "asc" } },
    },
  });
  if (!account) notFound();

  const facilities = await prisma.facility.findMany({ orderBy: { name: "asc" } });
  const enrollBound = createSiteEnrollment.bind(null, account.id);
  const addControlledAreaBound = createControlledArea.bind(null, account.id);
  const updateAccountBound = updateEnterpriseAccount.bind(null, account.id);
  const enrolledBuildings = account.siteEnrollments.flatMap((e) =>
    e.facility.buildings.map((b) => ({ ...b, facilityName: e.facility.name, siteEnrollmentId: e.id }))
  );

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
              <CardTitle>Controlled areas</CardTitle>
            </CardHeader>
            <Table>
              <THead>
                <tr>
                  <TH>Label</TH>
                  <TH>Facility</TH>
                  <TH>Building</TH>
                  <TH>Room</TH>
                </tr>
              </THead>
              <TBody>
                {account.siteEnrollments.flatMap((e) => e.controlledAreas).length === 0 && (
                  <EmptyRow colSpan={4} message="No controlled areas defined — the tenant's footprint is the whole facility per enrollment." />
                )}
                {account.siteEnrollments.map((e) =>
                  e.controlledAreas.map((ca) => (
                    <TR key={ca.id}>
                      <TD>{ca.label}</TD>
                      <TD>{e.facility.name}</TD>
                      <TD>{ca.building?.name ?? "—"}</TD>
                      <TD>{ca.room?.name ?? "—"}</TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
            <CardBody className="border-t border-slate-100">
              {enrolledBuildings.length === 0 ? (
                <p className="text-sm text-slate-500">Add a building to an enrolled facility (under Admin → Facilities) before defining a controlled area.</p>
              ) : (
                <form action={addControlledAreaBound} className="flex flex-wrap items-end gap-3">
                  <div className="flex-1">
                    <Field label="Label" htmlFor="caLabel" required>
                      <Input id="caLabel" name="label" required placeholder="e.g. Suite 4B" />
                    </Field>
                  </div>
                  <div className="flex-1">
                    <Field label="Building" htmlFor="buildingId" hint="Or pick a room below">
                      <Select id="buildingId" name="buildingId" defaultValue="">
                        <option value="">—</option>
                        {enrolledBuildings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.facilityName} · {b.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="flex-1">
                    <Field label="Room" htmlFor="roomId" hint="Narrows to one room">
                      <Select id="roomId" name="roomId" defaultValue="">
                        <option value="">—</option>
                        {enrolledBuildings.flatMap((b) =>
                          b.rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {b.facilityName} · {b.name} · {room.name}
                            </option>
                          ))
                        )}
                      </Select>
                    </Field>
                  </div>
                  <Button type="submit">Add controlled area</Button>
                </form>
              )}
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
            </CardHeader>
            <CardBody>
              <form action={updateAccountBound} className="space-y-3">
                <Field label="Display name" htmlFor="accountName" required>
                  <Input id="accountName" name="name" defaultValue={account.name} required />
                </Field>
                <Field label="Legal name (optional)" htmlFor="accountLegalName">
                  <Input id="accountLegalName" name="legalName" defaultValue={account.legalName ?? ""} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tier" htmlFor="accountTier" required>
                    <Select id="accountTier" name="tier" defaultValue={account.tier} required>
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Enterprise">Enterprise</option>
                    </Select>
                  </Field>
                  <Field label="Status" htmlFor="accountStatus" required>
                    <Select id="accountStatus" name="status" defaultValue={account.status} required>
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Billing email" htmlFor="accountBillingEmail">
                  <Input id="accountBillingEmail" name="billingEmail" type="email" defaultValue={account.billingEmail ?? ""} />
                </Field>
                <Button type="submit" className="w-full" variant="secondary">
                  Save account details
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
