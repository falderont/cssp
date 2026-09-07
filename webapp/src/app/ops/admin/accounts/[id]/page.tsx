import { notFound } from "next/navigation";
import { Pencil, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireAccountManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  createControlledArea,
  createSiteEnrollment,
  updateEnterpriseAccount,
  createTenantUserForAccount,
  updateTenantUserForAccount,
  toggleTenantAccountUserActive,
  resetTenantAccountUserPassword,
} from "@/actions/admin";
import { CUSTOMER_ROLES, ROLES, ROLE_LABELS, type Role } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

// A native <details>/<summary> disclosure needs no client JS, so an inline
// "click to edit/reset" form can live right on this server-rendered page —
// same pattern as the facility detail page's EditDisclosure.
function Disclosure({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <details className="relative shrink-0">
      <summary
        title={label}
        className="cursor-pointer list-none rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 [&::-webkit-details-marker]:hidden"
      >
        {icon}
      </summary>
      <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">{children}</div>
    </details>
  );
}

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAccountManager();
  const isSysAdmin = user.role === ROLES.SYS_ADMIN;
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
  const enrolledFacilities = account.siteEnrollments.map((e) => e.facility);
  const enrollBound = createSiteEnrollment.bind(null, account.id);
  const addControlledAreaBound = createControlledArea.bind(null, account.id);
  const updateAccountBound = updateEnterpriseAccount.bind(null, account.id);
  const addUserBound = createTenantUserForAccount.bind(null, account.id);
  const enrolledBuildings = account.siteEnrollments.flatMap((e) =>
    e.facility.buildings.map((b) => ({ ...b, facilityName: e.facility.name, siteEnrollmentId: e.id }))
  );

  return (
    <div>
      <PageHeader title={account.name} description={`${account.tier} tier`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {isSysAdmin && (
            <>
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
                  <ActionForm action={enrollBound} className="flex flex-wrap items-end gap-3">
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
                  </ActionForm>
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
                    <ActionForm action={addControlledAreaBound} className="flex flex-wrap items-end gap-3">
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
                    </ActionForm>
                  )}
                </CardBody>
              </Card>
            </>
          )}

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
                {account.users.length === 0 && <EmptyRow colSpan={5} message="No users yet — add one below." />}
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
                      <div className="flex items-center gap-1">
                        <Disclosure label="Edit user" icon={<Pencil className="h-3.5 w-3.5" />}>
                          <ActionForm action={updateTenantUserForAccount.bind(null, u.id, account.id)} className="space-y-2">
                            <Input name="name" defaultValue={u.name} required placeholder="Full name" className="text-xs" />
                            <Input name="email" type="email" defaultValue={u.email} required placeholder="Email" className="text-xs" />
                            <Select name="role" defaultValue={u.role} required className="text-xs">
                              {CUSTOMER_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </option>
                              ))}
                            </Select>
                            <Select name="restrictedFacilityId" defaultValue={u.restrictedFacilityId ?? ""} className="text-xs">
                              <option value="">All enrolled sites</option>
                              {enrolledFacilities.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                            </Select>
                            <Button type="submit" size="sm" className="w-full">
                              Save
                            </Button>
                          </ActionForm>
                        </Disclosure>
                        <Disclosure label="Reset password" icon={<KeyRound className="h-3.5 w-3.5" />}>
                          <ActionForm action={resetTenantAccountUserPassword.bind(null, u.id, account.id)} className="space-y-2">
                            <Input name="password" defaultValue="password123" required minLength={8} placeholder="New password" className="text-xs" />
                            <Button type="submit" size="sm" variant="secondary" className="w-full">
                              Reset password
                            </Button>
                          </ActionForm>
                        </Disclosure>
                        <ActionForm action={toggleTenantAccountUserActive.bind(null, u.id, account.id)} silent>
                          <Button type="submit" size="sm" variant="ghost">
                            {u.isActive ? "Disable" : "Enable"}
                          </Button>
                        </ActionForm>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <CardBody className="border-t border-slate-100">
              <p className="mb-3 text-sm font-medium text-slate-700">Add user</p>
              <ActionForm action={addUserBound} className="flex flex-wrap items-end gap-3">
                <div className="flex-1 basis-40">
                  <Field label="Full name" htmlFor="tuName" required>
                    <Input id="tuName" name="name" required />
                  </Field>
                </div>
                <div className="flex-1 basis-48">
                  <Field label="Work email" htmlFor="tuEmail" required>
                    <Input id="tuEmail" name="email" type="email" required />
                  </Field>
                </div>
                <div className="flex-1 basis-40">
                  <Field label="Temporary password" htmlFor="tuPassword" required hint="At least 8 characters">
                    <Input id="tuPassword" name="password" defaultValue="password123" required minLength={8} />
                  </Field>
                </div>
                <div className="flex-1 basis-40">
                  <Field label="Role" htmlFor="tuRole" required>
                    <Select id="tuRole" name="role" required defaultValue={CUSTOMER_ROLES[0]}>
                      {CUSTOMER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                {enrolledFacilities.length > 0 && (
                  <div className="flex-1 basis-40">
                    <Field label="Restrict to one site (optional)" htmlFor="tuFacility">
                      <Select id="tuFacility" name="restrictedFacilityId" defaultValue="">
                        <option value="">All enrolled sites</option>
                        {enrolledFacilities.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                )}
                <Button type="submit">Add user</Button>
              </ActionForm>
            </CardBody>
          </Card>
        </div>

        {isSysAdmin && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account details</CardTitle>
              </CardHeader>
              <CardBody>
                <ActionForm action={updateAccountBound} className="space-y-3">
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
                </ActionForm>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
