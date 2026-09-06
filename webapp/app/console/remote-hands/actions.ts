"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canAssignRemoteHands, canFulfillRemoteHands, canEditBillableMinutes, assert } from "@/lib/rbac";
import { saveUploadedFile } from "@/lib/storage";

export async function acceptAndAssign(formData: FormData): Promise<void> {
  const session = await requireSession();
  assert(canAssignRemoteHands(session.role));
  const taskId = formData.get("taskId");
  const technicianId = formData.get("technicianId");
  if (typeof taskId !== "string" || typeof technicianId !== "string" || !technicianId) {
    throw new Error("Choose a technician to assign.");
  }

  await withTenant(session.organizationId, (tx) =>
    tx.remoteHandsTask.update({
      where: { id: taskId },
      data: { status: "ACCEPTED", assignedTechnicianId: technicianId },
    }),
  );

  revalidatePath("/console/remote-hands");
  revalidatePath("/portal/remote-hands");
}

export async function startTask(formData: FormData): Promise<void> {
  const session = await requireSession();
  assert(canFulfillRemoteHands(session.role));
  const taskId = formData.get("taskId");
  if (typeof taskId !== "string") throw new Error("Invalid request.");

  await withTenant(session.organizationId, (tx) =>
    tx.remoteHandsTask.update({ where: { id: taskId }, data: { status: "IN_PROGRESS", startedAt: new Date() } }),
  );

  revalidatePath("/console/remote-hands");
  revalidatePath("/portal/remote-hands");
}

export type CompleteTaskState = { error?: string } | undefined;

export async function completeTask(_prev: CompleteTaskState, formData: FormData): Promise<CompleteTaskState> {
  const session = await requireSession();
  if (!canFulfillRemoteHands(session.role)) return { error: "You don't have permission to complete this task." };

  const taskId = formData.get("taskId");
  const completionNotes = formData.get("completionNotes");
  if (typeof taskId !== "string" || typeof completionNotes !== "string" || !completionNotes.trim()) {
    return { error: "Completion notes are required." };
  }

  const photo = formData.get("completionPhoto");
  let completionPhotoRef: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    const saved = await saveUploadedFile(photo, "remote-hands");
    completionPhotoRef = saved.fileRef;
  }

  await withTenant(session.organizationId, async (tx) => {
    const task = await tx.remoteHandsTask.findUniqueOrThrow({ where: { id: taskId } });
    const completedAt = new Date();
    const billableMinutes = task.startedAt
      ? Math.max(1, Math.round((completedAt.getTime() - task.startedAt.getTime()) / 60000))
      : null;

    await tx.remoteHandsTask.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        completedAt,
        billableMinutes,
        completionNotes,
        ...(completionPhotoRef ? { completionPhotoRef } : {}),
      },
    });

    // Auto-log to CS Engagement — see docs/prd-v4.md Section 5's "completed Remote
    // Hands task ... automatically appears in the assigned rep's/technician's timeline."
    if (task.assignedTechnicianId) {
      const siteEnrollment = await tx.siteEnrollment.findUniqueOrThrow({ where: { id: task.siteEnrollmentId } });
      await tx.engagementLog.create({
        data: {
          organizationId: session.organizationId,
          enterpriseAccountId: siteEnrollment.enterpriseAccountId,
          siteEnrollmentId: siteEnrollment.id,
          loggedByUserId: task.assignedTechnicianId,
          type: "REMOTE_HANDS",
          notes: `Remote hands task auto-logged: ${task.taskType.replace(/_/g, " ")} completed for ${task.assetOrRackRef}.`,
          linkedRemoteHandsTaskId: task.id,
        },
      });
    }
  });

  revalidatePath("/console/remote-hands");
  revalidatePath("/portal/remote-hands");
  revalidatePath("/console/engagement");
  return undefined;
}

export async function editBillableMinutes(formData: FormData): Promise<void> {
  const session = await requireSession();
  assert(canEditBillableMinutes(session.role));
  const taskId = formData.get("taskId");
  const minutes = Number(formData.get("billableMinutes"));
  if (typeof taskId !== "string" || Number.isNaN(minutes) || minutes < 0) throw new Error("Invalid input.");

  await withTenant(session.organizationId, (tx) =>
    tx.remoteHandsTask.update({ where: { id: taskId }, data: { billableMinutes: Math.round(minutes) } }),
  );

  revalidatePath("/console/remote-hands");
}
