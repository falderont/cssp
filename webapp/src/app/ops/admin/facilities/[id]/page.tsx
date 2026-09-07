import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  createBuilding,
  updateBuilding,
  deleteBuilding,
  createRack,
  updateRack,
  deleteRack,
  createRoom,
  updateRoom,
  deleteRoom,
  updateFacilityDetails,
  updateFacilityAcs,
  updateFacilitySpaceModel,
  deleteFacility,
} from "@/actions/admin";
import { createLoadingDock, toggleLoadingDockActive } from "@/actions/loading-docks";
import { decideAalEntry, revokeAalEntry } from "@/actions/aal";
import { ROLES, ROOM_TYPES, ROOM_TYPE_LABELS, AAL_ACCESS_LEVEL_LABELS, isAalExpired } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { ActionForm } from "@/components/errors/action-form";

// A native <details>/<summary> disclosure needs no client JS, so an existing
// building/room's edit form can live right on this server-rendered page
// instead of pulling the whole page into a client component just for one
// small "click to edit" toggle.
function EditDisclosure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="relative shrink-0">
      <summary
        title={label}
        className="cursor-pointer list-none rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 [&::-webkit-details-marker]:hidden"
      >
        <Pencil className="h-3.5 w-3.5" />
      </summary>
      <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">{children}</div>
    </details>
  );
}

export default async function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const isMasterDataAdmin = ([ROLES.SYS_ADMIN, ROLES.SERVICE_DESK] as string[]).includes(user.role);
  const canManageDocks = ([ROLES.SYS_ADMIN, ROLES.OPS_BUILDING_MANAGER] as string[]).includes(user.role);
  const canViewAal = ([ROLES.SYS_ADMIN, ROLES.OPS_SITE_MANAGER, ROLES.OPS_FRONT_OFFICE_SECURITY] as string[]).includes(user.role);
  const canDecideAal = ([ROLES.SYS_ADMIN, ROLES.OPS_SITE_MANAGER] as string[]).includes(user.role);

  const [facility, teams] = await Promise.all([
    prisma.facility.findUnique({
      where: { id },
      include: {
        city: { include: { country: { include: { region: true } } } },
        buildings: { include: { rooms: { include: { racks: true } } }, orderBy: { name: "asc" } },
        siteEnrollments: { include: { enterpriseAccount: true } },
        loadingDocks: { include: { building: true }, orderBy: { name: "asc" } },
        authorizedAccessEntries: { include: { enterpriseAccount: true }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
      },
    }),
    prisma.team.findMany({ where: { facilityId: id }, include: { members: true } }),
  ]);
  if (!facility) notFound();
  // Master-data admins can view any site; the day-to-day roles who reach
  // this page only for their Loading Docks/AAL card stay pinned to the one
  // facility they're restricted to, when they're restricted to one at all.
  if (!isMasterDataAdmin && user.restrictedFacilityId && user.restrictedFacilityId !== facility.id) notFound();

  const addBuildingBound = createBuilding.bind(null, facility.id);
  const updateAcsBound = updateFacilityAcs.bind(null, facility.id);
  const updateSpaceModelBound = updateFacilitySpaceModel.bind(null, facility.id);
  const updateFacilityDetailsBound = updateFacilityDetails.bind(null, facility.id);
  const isSysAdmin = user.role === ROLES.SYS_ADMIN;

  return (
    <div>
      <Link href="/ops/admin/facilities" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-brand">
        <ChevronLeft className="h-3.5 w-3.5" /> Site management
      </Link>
      <PageHeader
        title={facility.name}
        description={`${facility.city.country.region.name} · ${facility.city.country.name} · ${facility.city.name} · ${facility.code}`}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {isMasterDataAdmin && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Buildings & rooms</CardTitle>
                </CardHeader>
                <CardBody className="space-y-4">
                  {facility.buildings.length === 0 && <p className="text-sm text-slate-500">No buildings added yet.</p>}
                  {facility.buildings.map((b) => {
                    const addRoomBound = createRoom.bind(null, b.id);
                    const updateBuildingBound = updateBuilding.bind(null, b.id);
                    return (
                      <div key={b.id} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-slate-900">
                            {b.name} <span className="font-normal text-slate-400">({b.code})</span>
                          </p>
                          <div className="flex shrink-0 items-center gap-1">
                            <EditDisclosure label="Edit building">
                              <ActionForm action={updateBuildingBound} className="space-y-2">
                                <Input name="name" defaultValue={b.name} required placeholder="Building name" className="text-xs" />
                                <Input name="code" defaultValue={b.code} required placeholder="Code" className="text-xs" />
                                <Button type="submit" size="sm" className="w-full">
                                  Save
                                </Button>
                              </ActionForm>
                            </EditDisclosure>
                            <ConfirmDeleteButton
                              action={deleteBuilding.bind(null, b.id)}
                              confirmMessage={`Delete building ${b.name}? This can't be undone.`}
                              label="Delete building"
                              iconOnly
                            />
                          </div>
                        </div>
                        {b.rooms.length === 0 ? (
                          <p className="mt-1 text-sm text-slate-500">No rooms added yet.</p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {b.rooms.map((room) => {
                              const addRackBound = createRack.bind(null, facility.id, room.id);
                              const updateRoomBound = updateRoom.bind(null, room.id);
                              return (
                                <div key={room.id} className="rounded-lg bg-slate-50 px-3 py-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                      <span className="font-medium text-slate-800">
                                        {room.name} <span className="font-normal text-slate-400">({room.code})</span>
                                      </span>
                                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                        {ROOM_TYPE_LABELS[room.type] ?? room.type}
                                      </span>
                                    </div>
                                    <EditDisclosure label="Edit room">
                                      <ActionForm action={updateRoomBound} className="space-y-2">
                                        <Input name="name" defaultValue={room.name} required placeholder="Room name" className="text-xs" />
                                        <Input name="code" defaultValue={room.code} required placeholder="Code" className="text-xs" />
                                        <Select name="type" defaultValue={room.type} required className="text-xs">
                                          {ROOM_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                              {ROOM_TYPE_LABELS[t]}
                                            </option>
                                          ))}
                                        </Select>
                                        <Button type="submit" size="sm" className="w-full">
                                          Save
                                        </Button>
                                      </ActionForm>
                                    </EditDisclosure>
                                    <ConfirmDeleteButton
                                      action={deleteRoom.bind(null, room.id)}
                                      confirmMessage={`Delete room ${room.name}? This can't be undone.`}
                                      label="Delete room"
                                      iconOnly
                                    />
                                  </div>
                                  {facility.offersColoRacks && room.type === "DataHall" && (
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                      {room.racks.map((rack) => (
                                        <details key={rack.id} className="relative inline-block">
                                          <summary className="cursor-pointer list-none rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200 hover:ring-brand/40 [&::-webkit-details-marker]:hidden">
                                            {rack.rackNumber}
                                          </summary>
                                          <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                                            <ActionForm action={updateRack.bind(null, facility.id, rack.id)} className="space-y-2">
                                              <Input name="rackNumber" defaultValue={rack.rackNumber} required placeholder="Rack #" className="text-xs" />
                                              <Input name="notes" defaultValue={rack.notes ?? ""} placeholder="Notes (optional)" className="text-xs" />
                                              <Button type="submit" size="sm" className="w-full">
                                                Save
                                              </Button>
                                            </ActionForm>
                                            <ConfirmDeleteButton
                                              action={deleteRack.bind(null, facility.id, rack.id)}
                                              confirmMessage={`Delete rack ${rack.rackNumber}? This can't be undone.`}
                                              label="Delete rack"
                                              size="sm"
                                              className="mt-2 w-full"
                                            />
                                          </div>
                                        </details>
                                      ))}
                                      <ActionForm action={addRackBound} className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          name="rackNumber"
                                          placeholder="Rack #"
                                          required
                                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                                        />
                                        <Button type="submit" size="sm" variant="secondary">
                                          Add rack
                                        </Button>
                                      </ActionForm>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <ActionForm action={addRoomBound} className="mt-3 flex flex-wrap items-end gap-2">
                          <div className="flex-1">
                            <Field label="Room name" htmlFor={`roomName-${b.id}`} required>
                              <Input id={`roomName-${b.id}`} name="name" required placeholder="e.g. Data Hall 001" />
                            </Field>
                          </div>
                          <div className="flex-1">
                            <Field label="Code" htmlFor={`roomCode-${b.id}`} required>
                              <Input id={`roomCode-${b.id}`} name="code" required placeholder="DH001" />
                            </Field>
                          </div>
                          <div className="flex-1">
                            <Field label="Type" htmlFor={`roomType-${b.id}`} required>
                              <Select id={`roomType-${b.id}`} name="type" defaultValue="DataHall" required>
                                {ROOM_TYPES.map((t) => (
                                  <option key={t} value={t}>
                                    {ROOM_TYPE_LABELS[t]}
                                  </option>
                                ))}
                              </Select>
                            </Field>
                          </div>
                          <Button type="submit" variant="secondary">
                            Add room
                          </Button>
                        </ActionForm>
                      </div>
                    );
                  })}
                  <ActionForm action={addBuildingBound} className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
                    <div className="flex-1">
                      <Field label="Building name" htmlFor="name" required>
                        <Input id="name" name="name" required placeholder="e.g. Building B" />
                      </Field>
                    </div>
                    <div className="flex-1">
                      <Field label="Code" htmlFor="code" required>
                        <Input id="code" name="code" required placeholder="B" />
                      </Field>
                    </div>
                    <Button type="submit">Add building</Button>
                  </ActionForm>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enrolled tenants</CardTitle>
                </CardHeader>
                <Table>
                  <THead>
                    <tr>
                      <TH>Tenant</TH>
                      <TH>Space</TH>
                      <TH>Status</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {facility.siteEnrollments.length === 0 && <EmptyRow colSpan={3} message="No tenants enrolled at this facility yet." />}
                    {facility.siteEnrollments.map((e) => (
                      <TR key={e.id}>
                        <TD>{e.enterpriseAccount.name}</TD>
                        <TD>{e.spaceRef ?? "—"}</TD>
                        <TD>{e.status}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </Card>
            </>
          )}

          {canManageDocks && (
            <Card>
              <CardHeader>
                <CardTitle>Loading docks</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                {facility.loadingDocks.length === 0 && <p className="text-sm text-slate-400">No loading docks added yet.</p>}
                {facility.loadingDocks.map((dock) => (
                  <div key={dock.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{dock.name}</p>
                      <p className="truncate text-xs text-slate-400">{dock.building ? dock.building.name : "Site-level"}</p>
                    </div>
                    <ActionForm action={toggleLoadingDockActive.bind(null, dock.id)}>
                      <button
                        type="submit"
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition",
                          dock.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 ring-slate-500/20 hover:bg-slate-200"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", dock.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                        {dock.isActive ? "Active" : "Inactive"}
                      </button>
                    </ActionForm>
                  </div>
                ))}
                <ActionForm action={createLoadingDock} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                  <input type="hidden" name="facilityId" value={facility.id} />
                  <div className="min-w-[10rem] flex-1">
                    <Field label="Building (optional)" htmlFor="dockBuildingId">
                      <Select id="dockBuildingId" name="buildingId" defaultValue="">
                        <option value="">Site-level</option>
                        {facility.buildings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="min-w-[10rem] flex-1">
                    <Field label="Name" htmlFor="dockName">
                      <Input id="dockName" name="name" required placeholder="e.g. Loading Dock A" />
                    </Field>
                  </div>
                  <Button type="submit" variant="secondary">
                    Add dock
                  </Button>
                </ActionForm>
              </CardBody>
            </Card>
          )}

          {canViewAal && (
            <Card>
              <CardHeader>
                <CardTitle>Authorized Access List</CardTitle>
              </CardHeader>
              <Table>
                <THead>
                  <tr>
                    <TH>Name</TH>
                    <TH>Tenant</TH>
                    <TH>Access level</TH>
                    <TH>Valid until</TH>
                    <TH>Status</TH>
                    {canDecideAal && <TH>Actions</TH>}
                  </tr>
                </THead>
                <TBody>
                  {facility.authorizedAccessEntries.length === 0 && (
                    <EmptyRow colSpan={canDecideAal ? 6 : 5} message="No AAL requests for this site yet." />
                  )}
                  {facility.authorizedAccessEntries.map((e) => {
                    const expired = isAalExpired(e);
                    return (
                      <TR key={e.id}>
                        <TD className="font-medium text-slate-900">
                          {e.fullName}
                          {e.company && <p className="text-xs text-slate-400">{e.company}</p>}
                        </TD>
                        <TD>{e.enterpriseAccount.name}</TD>
                        <TD>{AAL_ACCESS_LEVEL_LABELS[e.accessLevel] ?? e.accessLevel}</TD>
                        <TD>{e.validUntil ? formatDate(e.validUntil) : "No expiry"}</TD>
                        <TD>
                          <StatusBadge status={expired ? "Expired" : e.status} />
                        </TD>
                        {canDecideAal && (
                          <TD>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {e.status === "PendingApproval" && (
                                <>
                                  <ActionForm action={decideAalEntry.bind(null, e.id, "Active")}>
                                    <Button type="submit" size="sm" variant="secondary">
                                      Approve
                                    </Button>
                                  </ActionForm>
                                  <ActionForm action={decideAalEntry.bind(null, e.id, "Rejected")}>
                                    <Button type="submit" size="sm" variant="danger">
                                      Reject
                                    </Button>
                                  </ActionForm>
                                </>
                              )}
                              {e.status === "Active" && !expired && (
                                <ActionForm action={revokeAalEntry.bind(null, e.id)}>
                                  <Button type="submit" size="sm" variant="danger">
                                    Revoke
                                  </Button>
                                </ActionForm>
                              )}
                            </div>
                          </TD>
                        )}
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </Card>
          )}
        </div>

        {isMasterDataAdmin && (
          <div className="space-y-6">
            {isSysAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Site details</CardTitle>
                </CardHeader>
                <CardBody>
                  <ActionForm action={updateFacilityDetailsBound} className="space-y-3">
                    <Field
                      label="Site name"
                      htmlFor="facilityName"
                      required
                      hint="Global Sys Admin only — shown across tenant portals, invoices and reports."
                    >
                      <Input id="facilityName" name="name" defaultValue={facility.name} required />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Code" htmlFor="facilityCode" required>
                        <Input id="facilityCode" name="code" defaultValue={facility.code} required />
                      </Field>
                      <Field label="Timezone" htmlFor="facilityTimezone" required>
                        <Input id="facilityTimezone" name="timezone" defaultValue={facility.timezone} required />
                      </Field>
                    </div>
                    <Field label="Address" htmlFor="facilityAddress">
                      <Input id="facilityAddress" name="address" defaultValue={facility.address ?? ""} />
                    </Field>
                    <Button type="submit" className="w-full" variant="secondary">
                      Save site details
                    </Button>
                  </ActionForm>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Space model</CardTitle>
              </CardHeader>
              <CardBody>
                <ActionForm action={updateSpaceModelBound} className="space-y-3">
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="offersColoRacks"
                      defaultChecked={facility.offersColoRacks}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300"
                    />
                    <span>
                      This site offers numbered colo racks
                      <span className="mt-0.5 block text-xs text-slate-500">
                        On: add rack numbers under Data Hall rooms. Off: this site leases whole rooms only (data
                        halls, offices, storage) with no rack-level breakdown.
                      </span>
                    </span>
                  </label>
                  <Button type="submit" className="w-full" variant="secondary">
                    Save
                  </Button>
                </ActionForm>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access control integration</CardTitle>
              </CardHeader>
              <CardBody>
                <ActionForm action={updateAcsBound} className="space-y-3">
                  <Field
                    label="ACS endpoint"
                    htmlFor="acsEndpointUrl"
                    hint="Leave blank to use the built-in mock adapter for demos"
                  >
                    <Input id="acsEndpointUrl" name="acsEndpointUrl" defaultValue={facility.acsEndpointUrl ?? ""} placeholder="https://acs.example.com/api/badges" />
                  </Field>
                  <Button type="submit" className="w-full" variant="secondary">
                    Save
                  </Button>
                </ActionForm>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teams stationed here</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                {teams.length === 0 && <p className="text-sm text-slate-500">No team scoped to this facility yet — see Teams in master data.</p>}
                {teams.map((t) => (
                  <div key={t.id} className="rounded-lg border border-slate-200 px-3 py-2">
                    <p className="text-sm font-medium text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.function} · {t.members.length} member(s)
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>

            {isSysAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Danger zone</CardTitle>
                </CardHeader>
                <CardBody>
                  <p className="mb-3 text-xs text-slate-500">
                    Deleting a site only succeeds once it has no buildings, tenant enrollments, incidents or other
                    records left — you'll be told exactly what to remove first if it does.
                  </p>
                  <ConfirmDeleteButton
                    action={deleteFacility.bind(null, facility.id)}
                    confirmMessage={`Delete site ${facility.name}? This can't be undone.`}
                    label="Delete site"
                    size="md"
                    className="w-full"
                  />
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
