"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser, requireInternalUser } from "@/lib/session";
import { assertSiteEnrollmentAccess } from "@/lib/scope";
import { notifyFacilityTenantUsers } from "@/lib/notify";
import { saveUploadedFile } from "@/lib/storage";
import { REMOTE_HANDS_TASK_TYPES } from "@/lib/constants";

const createSchema = z.object({
  siteEnrollmentId: z.string().min(1),
  taskType: z.enum(REMOTE_HANDS_TASK_TYPES),
  assetRef: z.string().min(1),
  description: z.string().min(1),
  requestedWindowStart: z.string().optional(),
  requestedWindowEnd: z.string().optional(),
});

export async function createRemoteHandsTask(formData: FormData) {
  const user = await requireCustomerUser();
  const parsed = createSchema.parse({
    siteEnrollmentId: formData.get("siteEnrollmentId"),
    taskType: formData.get("taskType"),
    assetRef: formData.get("assetRef"),
    description: formData.get("description"),
    requestedWindowStart: formData.get("requestedWindowStart") || undefined,
    requestedWindowEnd: formData.get("requestedWindowEnd") || undefined,
  });

  const hasAccess = await assertSiteEnrollmentAccess(user, parsed.siteEnrollmentId);
  if (!hasAccess) throw new Error("You do not have access to that site.");

  const task = await prisma.remoteHandsTask.create({
    data: {
      siteEnrollmentId: parsed.siteEnrollmentId,
      taskType: parsed.taskType,
      assetRef: parsed.assetRef,
      description: parsed.description,
      requestedWindowStart: parsed.requestedWindowStart ? new Date(parsed.requestedWindowStart) : null,
      requestedWindowEnd: parsed.requestedWindowEnd ? new Date(parsed.requestedWindowEnd) : null,
      createdById: user.id,
    },
  });

  revalidatePath("/portal/remote-hands");
  redirect(`/portal/remote-hands/${task.id}`);
}

export async function acceptAndAssignTask(taskId: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const assignedTechnicianId = String(formData.get("assignedTechnicianId") ?? "");
  if (!assignedTechnicianId) throw new Error("Choose a technician to assign.");

  const task = await prisma.remoteHandsTask.update({
    where: { id: taskId },
    data: { status: "Accepted", assignedTechnicianId },
    include: { siteEnrollment: true },
  });

  await notifyFacilityTenantUsers(task.siteEnrollment.facilityId, {
    title: "Remote hands request accepted",
    body: `Your request for "${task.assetRef}" has been accepted and assigned to a technician.`,
    category: "remote_hands",
    linkUrl: `/portal/remote-hands/${taskId}`,
  });

  revalidatePath(returnPath);
}

export async function startTask(taskId: string, returnPath: string) {
  await requireInternalUser();
  await prisma.remoteHandsTask.update({ where: { id: taskId }, data: { status: "InProgress", startedAt: new Date() } });
  revalidatePath(returnPath);
}

export async function completeTask(taskId: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const completionNotes = String(formData.get("completionNotes") ?? "");
  const billableMinutesOverride = formData.get("billableMinutesOverride");
  const photo = formData.get("completionPhoto");

  const existing = await prisma.remoteHandsTask.findUniqueOrThrow({
    where: { id: taskId },
    include: { siteEnrollment: true },
  });

  const completedAt = new Date();
  const autoMinutes = existing.startedAt
    ? Math.max(1, Math.round((completedAt.getTime() - existing.startedAt.getTime()) / 60000))
    : 15;
  const billableMinutes =
    billableMinutesOverride && String(billableMinutesOverride).trim() !== ""
      ? Number(billableMinutesOverride)
      : autoMinutes;

  let completionPhotoUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    const saved = await saveUploadedFile(photo, "photos");
    completionPhotoUrl = saved.storageKey;
  }

  await prisma.remoteHandsTask.update({
    where: { id: taskId },
    data: {
      status: "Completed",
      completedAt,
      billableMinutes,
      completionNotes,
      ...(completionPhotoUrl ? { completionPhotoUrl } : {}),
    },
  });

  if (existing.assignedTechnicianId) {
    await prisma.engagementLog.create({
      data: {
        enterpriseAccountId: existing.siteEnrollment.enterpriseAccountId,
        repId: existing.assignedTechnicianId,
        type: "remote_hands",
        notes: `Completed remote hands task: ${existing.taskType} — ${existing.assetRef} (${billableMinutes} billable min).`,
        linkedRemoteHandsTaskId: taskId,
      },
    });
  }

  await notifyFacilityTenantUsers(existing.siteEnrollment.facilityId, {
    title: "Remote hands task completed",
    body: `"${existing.assetRef}" is complete. View the technician's notes and completion proof.`,
    category: "remote_hands",
    linkUrl: `/portal/remote-hands/${taskId}`,
  });

  revalidatePath(returnPath);
}

export async function submitRemoteHandsCsat(taskId: string, rating: "up" | "down", returnPath: string) {
  await requireCustomerUser();
  await prisma.remoteHandsTask.update({ where: { id: taskId }, data: { csatRating: rating } });
  revalidatePath(returnPath);
}
