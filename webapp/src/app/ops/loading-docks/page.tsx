import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireBuildingManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createLoadingDock, toggleLoadingDockActive } from "@/actions/loading-docks";
import { cn } from "@/lib/utils";

export default async function LoadingDocksPage() {
  const user = await requireBuildingManager();
  const facilityWhere = user.restrictedFacilityId ? { id: user.restrictedFacilityId } : undefined;

  const [facilities, docks] = await Promise.all([
    prisma.facility.findMany({
      where: facilityWhere,
      orderBy: { name: "asc" },
      include: { buildings: { orderBy: { name: "asc" } } },
    }),
    prisma.loadingDock.findMany({
      where: user.restrictedFacilityId ? { facilityId: user.restrictedFacilityId } : undefined,
      include: { facility: true, building: true },
      orderBy: [{ facility: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Loading docks"
        description="Arrival locations tenants pick from when submitting a delivery ticket — a loading dock, a rear dock, or any other physical hand-off point at a site."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All locations ({docks.length})</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {docks.length === 0 && <p className="text-sm text-slate-400">No loading docks added yet.</p>}
              {docks.map((dock) => (
                <div key={dock.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{dock.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {dock.facility.name}
                      {dock.building ? ` · ${dock.building.name}` : " · Site-level"}
                    </p>
                  </div>
                  <form action={toggleLoadingDockActive.bind(null, dock.id)}>
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
                  </form>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add a location</CardTitle>
          </CardHeader>
          <CardBody>
            <form action={createLoadingDock} className="space-y-3">
              <Field label="Site" htmlFor="facilityId" required>
                <Select id="facilityId" name="facilityId" required defaultValue={facilities.length === 1 ? facilities[0].id : ""}>
                  {facilities.length !== 1 && <option value="">Choose…</option>}
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Building (optional)" htmlFor="buildingId" hint="Leave blank for a single shared dock at this site.">
                <Select id="buildingId" name="buildingId" defaultValue="">
                  <option value="">Site-level (no specific building)</option>
                  {facilities.map((f) =>
                    f.buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {facilities.length > 1 ? `${f.name} — ` : ""}
                        {b.name}
                      </option>
                    ))
                  )}
                </Select>
              </Field>
              <Field label="Name" htmlFor="name" required>
                <Input id="name" name="name" required placeholder="e.g. Loading Dock A, Rear dock" />
              </Field>
              <Button type="submit" className="w-full">
                Add location
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
      {docks.some((d) => !d.isActive) && (
        <p className="mt-3 text-xs text-slate-400">
          <Badge tone="slate">Inactive</Badge> locations stay on past tickets but no longer appear when a tenant submits a new one.
        </p>
      )}
    </div>
  );
}
