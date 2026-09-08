"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInternalUser } from "@/lib/session";
import { notifyFacilityTenantUsers } from "@/lib/notify";
import { saveUploadedFile } from "@/lib/storage";
import { INCIDENT_CATEGORIES, INCIDENT_SEVERITIES, INCIDENT_STATUSES } from "@/lib/constants";

const createSchema = z.object({
  facilityId: z.string().min(1),
  buildingId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(INCIDENT_CATEGORIES),
  locationDetail: z.string().optional(),
  severity: z.enum(INCIDENT_SEVERITIES),
  startedAt: z.string().min(1),
  isCustomerVisible: z.coerce.boolean(),
});

export async function createIncident(formData: FormData) {
  const user = await requireInternalUser();
  const impactedServices = formData.getAll("impactedServices").map(String);
  const parsed = createSchema.parse({
    facilityId: formData.get("facilityId"),
    buildingId: formData.get("buildingId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    locationDetail: formData.get("locationDetail") || undefined,
    severity: formData.get("severity"),
    startedAt: formData.get("startedAt"),
    isCustomerVisible: formData.get("isCustomerVisible") === "on",
  });

  const incident = await prisma.incident.create({
    data: {
      facilityId: parsed.facilityId,
      buildingId: parsed.buildingId || null,
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      impactedServices: JSON.stringify(impactedServices),
      locationDetail: parsed.locationDetail || null,
      severity: parsed.severity,
      startedAt: new Date(parsed.startedAt),
      isCustomerVisible: parsed.isCustomerVisible,
      createdById: user.id,
    },
  });

  if (parsed.isCustomerVisible) {
    await notifyFacilityTenantUsers(parsed.facilityId, {
      title: `New incident: ${parsed.title}`,
      body: parsed.description,
      category: "incident",
      linkUrl: `/portal/incidents/${incident.id}`,
    });
  }

  revalidatePath("/ops/incidents");
  redirect(`/ops/incidents/${incident.id}`);
}

const updateSchema = z.object({
  message: z.string().min(1),
  status: z.enum(INCIDENT_STATUSES).optional(),
});

export async function postIncidentUpdate(incidentId: string, returnPath: string, formData: FormData) {
  const user = await requireInternalUser();
  const parsed = updateSchema.parse({
    message: formData.get("message"),
    status: formData.get("status") || undefined,
  });

  await prisma.incidentUpdate.create({
    data: { incidentId, message: parsed.message, createdById: user.id },
  });

  const incident = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      ...(parsed.status ? { status: parsed.status, resolvedAt: parsed.status === "Resolved" ? new Date() : null } : {}),
    },
  });

  if (incident.isCustomerVisible) {
    await notifyFacilityTenantUsers(incident.facilityId, {
      title: `Update: ${incident.title}`,
      body: parsed.message,
      category: "incident",
      linkUrl: `/portal/incidents/${incidentId}`,
    });
  }

  revalidatePath(returnPath);
}

export async function toggleIncidentVisibility(incidentId: string, returnPath: string) {
  await requireInternalUser();
  const incident = await prisma.incident.findUniqueOrThrow({ where: { id: incidentId } });
  await prisma.incident.update({ where: { id: incidentId }, data: { isCustomerVisible: !incident.isCustomerVisible } });
  revalidatePath(returnPath);
}

export async function uploadIncidentReport(incidentId: string, returnPath: string, formData: FormData) {
  const user = await requireInternalUser();
  const file = formData.get("report");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Attach the incident report file exported from your DCIM.");
  }

  const saved = await saveUploadedFile(file, "incident-reports");
  const incident = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      reportFileName: saved.fileName,
      reportStorageKey: saved.storageKey,
      reportUploadedById: user.id,
      reportUploadedAt: new Date(),
    },
  });

  if (incident.isCustomerVisible) {
    await notifyFacilityTenantUsers(incident.facilityId, {
      title: `Incident report available: ${incident.title}`,
      body: "The closure report for this incident has been published.",
      category: "incident",
      linkUrl: `/portal/incidents/${incidentId}`,
    });
  }

  revalidatePath(returnPath);
}
