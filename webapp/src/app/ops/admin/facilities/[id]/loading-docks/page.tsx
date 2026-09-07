import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createLoadingDock, updateLoadingDock, toggleLoadingDockActive, deleteLoadingDock } from "@/actions/loading-docks";
import { cn } from "@/lib/utils";
import { getFacilityTabAccess } from "@/lib/facility-tabs";
import { ActionForm } from "@/components/errors/action-form";

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

export default async function FacilityLoadingDocksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const { canManageDocks } = getFacilityTabAccess(user.role);
  if (!canManageDocks) redirect(`/ops/admin/facilities/${id}`);

  const facility = await prisma.facility.findUnique({
    where: { id },
    include: { buildings: { orderBy: { name: "asc" } }, loadingDocks: { include: { building: true }, orderBy: { name: "asc" } } },
  });
  if (!facility) notFound();

  return (
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
            <div className="flex shrink-0 items-center gap-1">
              <ActionForm action={toggleLoadingDockActive.bind(null, dock.id)} silent>
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
              <EditDisclosure label="Edit loading dock">
                <ActionForm action={updateLoadingDock.bind(null, dock.id)} className="space-y-2">
                  <Input name="name" defaultValue={dock.name} required placeholder="Name" className="text-xs" />
                  <Select name="buildingId" defaultValue={dock.buildingId ?? ""} className="text-xs">
                    <option value="">Site-level</option>
                    {facility.buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" size="sm" className="w-full">
                    Save
                  </Button>
                </ActionForm>
              </EditDisclosure>
              <ConfirmDeleteButton
                action={deleteLoadingDock.bind(null, dock.id)}
                confirmMessage={`Delete loading dock ${dock.name}? This can't be undone.`}
                label="Delete loading dock"
                iconOnly
              />
            </div>
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
  );
}
