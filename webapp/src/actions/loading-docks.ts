"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBuildingManager } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { assertNoDependents, withForeignKeyConstraintMessage } from "@/lib/prisma-errors";

// A physical arrival point for logistics traffic — where a tenant's delivery
// ticket says the courier should be directed. Owned by whoever runs
// day-to-day building operations, not the Global Sys Admin's Area master
// data (see LoadingDock in schema.prisma).
export async function createLoadingDock(formData: FormData) {
  const user = await requireBuildingManager();
  const facilityId = String(formData.get("facilityId") ?? "");
  const buildingId = String(formData.get("buildingId") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!facilityId || !name) throw new Error("Site and name are required.");
  if (user.restrictedFacilityId && user.restrictedFacilityId !== facilityId) {
    throw new Error("You can only add loading docks for your assigned site.");
  }
  if (buildingId) {
    const building = await prisma.building.findUnique({ where: { id: buildingId } });
    if (!building || building.facilityId !== facilityId) throw new Error("That building doesn't belong to the selected site.");
  }

  const dock = await prisma.loadingDock.create({ data: { facilityId, buildingId, name, createdById: user.id } });
  await logAudit({
    actorId: user.id,
    action: "loading_dock.create",
    summary: `Added loading dock ${name}.`,
    targetType: "LoadingDock",
    targetId: dock.id,
  });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
  revalidatePath("/ops/loading-docks");
}

export async function updateLoadingDock(dockId: string, formData: FormData) {
  const user = await requireBuildingManager();
  const dock = await prisma.loadingDock.findUniqueOrThrow({ where: { id: dockId } });
  if (user.restrictedFacilityId && user.restrictedFacilityId !== dock.facilityId) {
    throw new Error("You can only manage loading docks for your assigned site.");
  }

  const buildingId = String(formData.get("buildingId") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  if (buildingId) {
    const building = await prisma.building.findUnique({ where: { id: buildingId } });
    if (!building || building.facilityId !== dock.facilityId) throw new Error("That building doesn't belong to this site.");
  }

  await prisma.loadingDock.update({ where: { id: dockId }, data: { name, buildingId } });
  await logAudit({
    actorId: user.id,
    action: "loading_dock.update",
    summary: `Updated loading dock ${name}.`,
    targetType: "LoadingDock",
    targetId: dockId,
  });
  revalidatePath(`/ops/admin/facilities/${dock.facilityId}`);
}

// Loading docks are toggled off rather than deleted when a delivery already
// points at one — see deleteLoadingDock for the guarded hard-delete used
// once there's nothing left referencing it.
export async function toggleLoadingDockActive(dockId: string) {
  const user = await requireBuildingManager();
  const dock = await prisma.loadingDock.findUniqueOrThrow({ where: { id: dockId } });
  if (user.restrictedFacilityId && user.restrictedFacilityId !== dock.facilityId) {
    throw new Error("You can only manage loading docks for your assigned site.");
  }

  const isActive = !dock.isActive;
  await prisma.loadingDock.update({ where: { id: dockId }, data: { isActive } });
  await logAudit({
    actorId: user.id,
    action: "loading_dock.toggle_active",
    summary: `Marked loading dock ${dock.name} ${isActive ? "active" : "inactive"}.`,
    targetType: "LoadingDock",
    targetId: dockId,
  });
  revalidatePath(`/ops/admin/facilities/${dock.facilityId}`);
  revalidatePath("/ops/loading-docks");
}

// Only succeeds once no delivery (past or present) still points at this
// dock — that history has to keep resolving to the dock it actually
// happened at. Still referenced? Toggle it inactive instead (above).
export async function deleteLoadingDock(dockId: string) {
  const user = await requireBuildingManager();
  const dock = await prisma.loadingDock.findUniqueOrThrow({ where: { id: dockId } });
  if (user.restrictedFacilityId && user.restrictedFacilityId !== dock.facilityId) {
    throw new Error("You can only manage loading docks for your assigned site.");
  }

  await assertNoDependents("loading dock", [
    prisma.delivery.count({ where: { loadingDockId: dockId } }).then((count) => ({ label: count === 1 ? "delivery" : "deliveries", count })),
  ]);
  await withForeignKeyConstraintMessage(
    () => prisma.loadingDock.delete({ where: { id: dockId } }),
    "Can't delete this loading dock — it still has related records. Remove those first."
  );
  await logAudit({
    actorId: user.id,
    action: "loading_dock.delete",
    summary: `Deleted loading dock ${dock.name}.`,
    targetType: "LoadingDock",
    targetId: dockId,
  });
  revalidatePath(`/ops/admin/facilities/${dock.facilityId}`);
  revalidatePath("/ops/loading-docks");
}
