import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireSysAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createBuilding, createRack, createRoom, updateFacilityAcs, updateFacilitySpaceModel } from "@/actions/admin";
import { ROOM_TYPES, ROOM_TYPE_LABELS } from "@/lib/constants";

export default async function FacilityDetailPage({ params }: { params: { id: string } }) {
  await requireSysAdmin();
  const facility = await prisma.facility.findUnique({
    where: { id: params.id },
    include: {
      region: true,
      buildings: true,
      siteEnrollments: { include: { enterpriseAccount: true } },
      rooms: { include: { building: true, racks: true }, orderBy: { code: "asc" } },
    },
  });
  if (!facility) notFound();

  const addBuildingBound = createBuilding.bind(null, facility.id);
  const updateAcsBound = updateFacilityAcs.bind(null, facility.id);
  const updateSpaceModelBound = updateFacilitySpaceModel.bind(null, facility.id);
  const addRoomBound = createRoom.bind(null, facility.id);

  return (
    <div>
      <PageHeader title={facility.name} description={`${facility.region.name} · ${facility.code}`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Buildings</CardTitle>
            </CardHeader>
            <Table>
              <THead>
                <tr>
                  <TH>Name</TH>
                  <TH>Code</TH>
                </tr>
              </THead>
              <TBody>
                {facility.buildings.length === 0 && <EmptyRow colSpan={2} message="No buildings added yet." />}
                {facility.buildings.map((b) => (
                  <TR key={b.id}>
                    <TD>{b.name}</TD>
                    <TD>{b.code}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <CardBody className="border-t border-slate-100">
              <form action={addBuildingBound} className="flex flex-wrap items-end gap-3">
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
              <CardTitle>Rooms{facility.offersColoRacks ? " & racks" : ""}</CardTitle>
            </CardHeader>
            <Table>
              <THead>
                <tr>
                  <TH>Name</TH>
                  <TH>Code</TH>
                  <TH>Type</TH>
                  <TH>Building</TH>
                  {facility.offersColoRacks && <TH>Racks</TH>}
                </tr>
              </THead>
              <TBody>
                {facility.rooms.length === 0 && (
                  <EmptyRow colSpan={facility.offersColoRacks ? 5 : 4} message="No rooms added yet." />
                )}
                {facility.rooms.map((room) => {
                  const addRackBound = createRack.bind(null, facility.id, room.id);
                  return (
                    <TR key={room.id}>
                      <TD className="font-medium text-slate-900">{room.name}</TD>
                      <TD>{room.code}</TD>
                      <TD>{ROOM_TYPE_LABELS[room.type] ?? room.type}</TD>
                      <TD>{room.building?.name ?? "—"}</TD>
                      {facility.offersColoRacks && (
                        <TD>
                          {room.type === "DataHall" ? (
                            <div className="space-y-2">
                              {room.racks.length > 0 && (
                                <p className="text-xs text-slate-600">{room.racks.map((r) => r.rackNumber).join(", ")}</p>
                              )}
                              <form action={addRackBound} className="flex gap-1.5">
                                <input
                                  type="text"
                                  name="rackNumber"
                                  placeholder="Rack #"
                                  required
                                  className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                                />
                                <Button type="submit" size="sm" variant="secondary">
                                  Add
                                </Button>
                              </form>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TD>
                      )}
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <CardBody className="border-t border-slate-100">
              <form action={addRoomBound} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[10rem] flex-1">
                  <Field label="Room name" htmlFor="roomName" required>
                    <Input id="roomName" name="name" required placeholder="e.g. Data Hall 1" />
                  </Field>
                </div>
                <div className="w-28">
                  <Field label="Code" htmlFor="roomCode" required>
                    <Input id="roomCode" name="code" required placeholder="DH1" />
                  </Field>
                </div>
                <div className="w-44">
                  <Field label="Type" htmlFor="roomType" required>
                    <Select id="roomType" name="type" defaultValue="DataHall" required>
                      {ROOM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {ROOM_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                {facility.buildings.length > 0 && (
                  <div className="w-44">
                    <Field label="Building (optional)" htmlFor="roomBuildingId">
                      <Select id="roomBuildingId" name="buildingId" defaultValue="">
                        <option value="">Not specified</option>
                        {facility.buildings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                )}
                <Button type="submit">Add room</Button>
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
                  This facility offers numbered colo racks
                  <span className="mt-0.5 block text-xs text-slate-500">
                    On: add rack numbers under Data Hall rooms. Off: this facility leases whole rooms only (data
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
      </div>
    </div>
  );
}
