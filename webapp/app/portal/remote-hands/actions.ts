"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { resolvePortalScope } from "@/lib/portal-scope";
import { assert } from "@/lib/rbac";

const CreateSchema = z.object({
  siteEnrollmentId: z.string().min(1),
  taskType: z.enum(["POWER_CYCLE", "VISUAL_INSPECTION", "CABLE_PATCH", "MOUNT_UNMOUNT", "KVM_ACCESS", "OTHER"]),
  assetOrRackRef: z.string().trim().min(1, "Asset or rack reference is required."),
  description: z.string().trim().min(1, "Description is required."),
  requestedWindowStart: z.string().optional(),
  requestedWindowEnd: z.string().optional(),
});

export type CreateRemoteHandsState = { error?: string } | undefined;

export async function createRemoteHandsRequest(
  _prev: CreateRemoteHandsState,
  formData: FormData,
): Promise<CreateRemoteHandsState> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse({
    siteEnrollmentId: formData.get("siteEnrollmentId"),
    taskType: formData.get("taskType"),
    assetOrRackRef: formData.get("assetOrRackRef"),
    description: formData.get("description"),
    requestedWindowStart: formData.get("requestedWindowStart") || undefined,
    requestedWindowEnd: formData.get("requestedWindowEnd") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session);
    assert(scope.enrollments.some((e) => e.id === parsed.data.siteEnrollmentId), "You don't have access to that site.");
    await tx.remoteHandsTask.create({
      data: {
        organizationId: session.organizationId,
        siteEnrollmentId: parsed.data.siteEnrollmentId,
        taskType: parsed.data.taskType,
        assetOrRackRef: parsed.data.assetOrRackRef,
        description: parsed.data.description,
        requestedWindowStart: parsed.data.requestedWindowStart ? new Date(parsed.data.requestedWindowStart) : null,
        requestedWindowEnd: parsed.data.requestedWindowEnd ? new Date(parsed.data.requestedWindowEnd) : null,
        status: "SUBMITTED",
        createdByUserId: session.userId,
      },
    });
  });

  revalidatePath("/portal/remote-hands");
  return undefined;
}

export async function rateRemoteHandsTask(formData: FormData): Promise<void> {
  const session = await requireSession();
  const taskId = formData.get("taskId");
  const rating = Number(formData.get("rating"));
  if (typeof taskId !== "string" || !taskId || !(rating >= 1 && rating <= 5)) {
    throw new Error("Invalid rating.");
  }

  await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session);
    const task = await tx.remoteHandsTask.findUniqueOrThrow({ where: { id: taskId } });
    assert(scope.enrollments.some((e) => e.id === task.siteEnrollmentId));
    assert(task.status === "COMPLETED", "Only completed tasks can be rated.");
    assert(task.csatRating === null, "Already rated.");
    await tx.remoteHandsTask.update({ where: { id: taskId }, data: { csatRating: rating } });
  });

  revalidatePath("/portal/remote-hands");
}
