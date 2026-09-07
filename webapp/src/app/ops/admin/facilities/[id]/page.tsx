import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireMasterDataAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createBuilding, createRack, createRoom, updateFacilityAcs, updateFacilitySpaceModel } from "@/actions/admin";
import { ROOM_TYPES, ROOM_TYPE_LABELS } from "@/lib/constants";

export default async function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireMasterDataAdmin();
  const [facility, teams] = await Promise.all([
    prisma.facility.findUnique({
      where: { id },
      include: {
        city: { include: { country: { include: { region: true } } } },
        buildings: { include: { rooms: { include: { racks: true } } }, orderBy: { name: "asc" } },
        siteEnrollments: { include: { enterpriseAccount: true } },
      },
    }),
    prisma.team.findMany({ where: { facilityId: id }, include: { members: true } }),
  ]);
  if (!facility) notFound();

  const addBuildingBound = createBuilding.bind(null, facility.id);
  const updateAcsBound = updateFacilityAcs.bind(null, facility.id);
  const updateSpaceModelBound = updateFacilitySpaceModel.bind(null, facility.id);

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
          <Card>
            <CardHeader>
              <CardTitle>Buildings & rooms</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {facility.buildings.length === 0 && <p className="text-sm text-slate-500">No buildings added yet.</p>}
              {facility.buildings.map((b) => {
                const addRoomBound = createRoom.bind(null, b.id);
                return (
                  <div key={b.id} className="rounded-lg border border-slate-100 p-3">
                    <p className="font-medium text-slate-900">
                      {b.name} <span className="font-normal text-slate-400">({b.code})</span>
                    </p>
                    {b.rooms.length === 0 ? (
                      <p className="mt-1 text-sm text-slate-500">No rooms added yet.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {b.rooms.map((room) => {
                          const addRackBound = createRack.bind(null, facility.id, room.id);
                          return (
                            <div key={room.id} className="rounded-lg bg-slate-50 px-3 py-2">
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="font-medium text-slate-800">
                                  {room.name} <span className="font-normal text-slate-400">({room.code})</span>
                                </span>
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                  {ROOM_TYPE_LABELS[room.type] ?? room.type}
                                </span>
                              </div>
                              {facility.offersColoRacks && room.type === "DataHall" && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  {room.racks.map((rack) => (
                                    <span key={rack.id} className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
                                      {rack.rackNumber}
                                    </span>
                                  ))}
                                  <form action={addRackBound} className="flex items-center gap-1.5">
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
                                  </form>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <form action={addRoomBound} className="mt-3 flex flex-wrap items-end gap-2">
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
                    </form>
                  </div>
                );
              })}
              <form action={addBuildingBound} className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
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
              </form>
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Space model</CardTitle>
            </CardHeader>
            <CardBody>
              <form action={updateSpaceModelBound} className="space-y-3">
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
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access control integration</CardTitle>
            </CardHeader>
            <CardBody>
              <form action={updateAcsBound} className="space-y-3">
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
              </form>
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
        </div>
      </div>
    </div>
  );
}
