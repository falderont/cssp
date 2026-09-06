"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canPublishIncidents, assert } from "@/lib/rbac";
import { incidentSourceAdapter } from "@/lib/adapters/incident-source";

const PublishSchema = z.object({
  facilityId: z.string().min(1),
  type: z.enum(["INCIDENT", "MAINTENANCE"]),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "MONITORING", "RESOLVED"]),
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().min(1, "Description is required."),
  startAt: z.string().min(1, "Start time is required."),
  endAt: z.string().optional(),
});

export type PublishIncidentState = { error?: string } | undefined;

export async function publishIncident(_prev: PublishIncidentState, formData: FormData): Promise<PublishIncidentState> {
  const session = await requireSession();
  assert(canPublishIncidents(session.role), "You don't have permission to publish incidents.");

  const parsed = PublishSchema.safeParse({
    facilityId: formData.get("facilityId"),
    type: formData.get("type"),
    status: formData.get("status"),
    title: formData.get("title"),
    description: formData.get("description"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const normalized = incidentSourceAdapter.normalize({
    facilityId: parsed.data.facilityId,
    type: parsed.data.type,
    status: parsed.data.status,
    title: parsed.data.title,
    description: parsed.data.description,
    source: "MANUAL",
    startAt: new Date(parsed.data.startAt),
    endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
  });

  await withTenant(session.organizationId, (tx) =>
    tx.incidentOrMaintenance.create({ data: { organizationId: session.organizationId, ...normalized } }),
  );

  revalidatePath("/console/incidents");
  revalidatePath("/portal/incidents");
  return undefined;
}

export async function updateIncidentStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  assert(canPublishIncidents(session.role));
  const id = formData.get("incidentId");
  const status = formData.get("status");
  if (typeof id !== "string" || typeof status !== "string") throw new Error("Invalid request.");

  await withTenant(session.organizationId, (tx) =>
    tx.incidentOrMaintenance.update({
      where: { id },
      data: { status: status as "SCHEDULED" | "IN_PROGRESS" | "MONITORING" | "RESOLVED" },
    }),
  );

  revalidatePath("/console/incidents");
  revalidatePath("/portal/incidents");
}
