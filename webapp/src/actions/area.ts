"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInternalUser, requireMasterDataAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { AREA_CHANGE_ACTIONS, AREA_LEVELS } from "@/lib/constants";

// Any internal user can request a change to Area master data (a new site,
// a renamed building, a new room, etc.) — they don't get direct edit access
// unless they're Sys Admin or Service Desk (see requireMasterDataAdmin()).
// The request lands as a ticket for Service Desk/Sys Admin to triage.

const submitSchema = z.object({
  level: z.enum(AREA_LEVELS),
  action: z.enum(AREA_CHANGE_ACTIONS),
  context: z.string().min(1),
  proposedName: z.string().optional(),
  proposedCode: z.string().optional(),
  notes: z.string().min(1),
});

export async function submitAreaChangeRequest(formData: FormData) {
  const user = await requireInternalUser();
  const parsed = submitSchema.parse({
    level: formData.get("level"),
    action: formData.get("action"),
    context: formData.get("context"),
    proposedName: formData.get("proposedName") || undefined,
    proposedCode: formData.get("proposedCode") || undefined,
    notes: formData.get("notes"),
  });

  const request = await prisma.areaChangeRequest.create({
    data: {
      level: parsed.level,
      action: parsed.action,
      context: parsed.context,
      proposedName: parsed.proposedName || null,
      proposedCode: parsed.proposedCode || null,
      notes: parsed.notes,
      requestedById: user.id,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "area_change_request.create",
    summary: `Requested ${parsed.action.toLowerCase()} ${parsed.level} — ${parsed.context}.`,
    targetType: "AreaChangeRequest",
    targetId: request.id,
  });
  revalidatePath("/ops/admin/area-change-requests");
  redirect("/ops/admin/area-change-requests");
}

const decisionSchema = z.object({
  status: z.enum(["InReview", "Approved", "Rejected", "Applied"]),
  decisionNotes: z.string().optional(),
});

export async function decideAreaChangeRequest(requestId: string, formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const parsed = decisionSchema.parse({
    status: formData.get("status"),
    decisionNotes: formData.get("decisionNotes") || undefined,
  });

  await prisma.areaChangeRequest.update({
    where: { id: requestId },
    data: {
      status: parsed.status,
      decisionNotes: parsed.decisionNotes || null,
      decidedById: admin.id,
      decidedAt: new Date(),
      assignedToId: admin.id,
    },
  });

  await logAudit({
    actorId: admin.id,
    action: "area_change_request.decide",
    summary: `Marked area change request ${parsed.status}.`,
    targetType: "AreaChangeRequest",
    targetId: requestId,
  });
  revalidatePath("/ops/admin/area-change-requests");
}
