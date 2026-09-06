"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInternalUser } from "@/lib/session";
import { notifyFacilityTenantUsers } from "@/lib/notify";
import { MAINTENANCE_IMPACTS, MAINTENANCE_STATUSES, MAINTENANCE_TYPES } from "@/lib/constants";

const createSchema = z.object({
  facilityId: z.string().min(1),
  buildingId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  maintType: z.enum(MAINTENANCE_TYPES),
  impact: z.enum(MAINTENANCE_IMPACTS),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
});

export async function createMaintenanceEvent(formData: FormData) {
  const user = await requireInternalUser();
  const parsed = createSchema.parse({
    facilityId: formData.get("facilityId"),
    buildingId: formData.get("buildingId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    maintType: formData.get("maintType"),
    impact: formData.get("impact"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
  });

  const facility = await prisma.facility.findUniqueOrThrow({ where: { id: parsed.facilityId } });

  const event = await prisma.maintenanceEvent.create({
    data: {
      facilityId: parsed.facilityId,
      buildingId: parsed.buildingId || null,
      title: parsed.title,
      description: parsed.description,
      maintType: parsed.maintType,
      impact: parsed.impact,
      startAt: new Date(parsed.startAt),
      endAt: new Date(parsed.endAt),
      createdById: user.id,
    },
  });

  const audience = `Tenants at ${facility.name}`;
  const message = `${parsed.maintType} maintenance scheduled: ${parsed.title} (${parsed.impact}).`;
  await prisma.maintenanceNotification.create({
    data: { maintenanceEventId: event.id, channel: "IN_APP", audience, message },
  });
  await notifyFacilityTenantUsers(parsed.facilityId, {
    title: `Maintenance scheduled: ${parsed.title}`,
    body: message,
    category: "maintenance",
    linkUrl: `/portal/maintenance/${event.id}`,
  });

  revalidatePath("/ops/maintenance");
  redirect(`/ops/maintenance/${event.id}`);
}

export async function updateMaintenanceStatus(maintenanceEventId: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const status = z.enum(MAINTENANCE_STATUSES).parse(formData.get("status"));

  const event = await prisma.maintenanceEvent.update({
    where: { id: maintenanceEventId },
    data: { status },
    include: { facility: true },
  });

  const message = `${event.title} is now ${status}.`;
  await prisma.maintenanceNotification.create({
    data: {
      maintenanceEventId,
      channel: "IN_APP",
      audience: `Tenants at ${event.facility.name}`,
      message,
    },
  });
  await notifyFacilityTenantUsers(event.facilityId, {
    title: `Maintenance update: ${event.title}`,
    body: message,
    category: "maintenance",
    linkUrl: `/portal/maintenance/${maintenanceEventId}`,
  });

  revalidatePath(returnPath);
}
