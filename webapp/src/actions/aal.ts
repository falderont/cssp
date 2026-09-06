"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAdminOrSiteLead, requireInternalUser } from "@/lib/session";
import { notifyFacilityTenantUsers } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { assertSiteEnrollmentAccess } from "@/lib/scope";
import { AAL_ACCESS_LEVELS, ROLES } from "@/lib/constants";

const requestSchema = z.object({
  facilityId: z.string().min(1),
  fullName: z.string().min(1),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  company: z.string().optional(),
  accessLevel: z.enum(AAL_ACCESS_LEVELS),
  reason: z.string().min(1),
  validUntil: z.string().optional(),
});

export async function requestAalEntry(formData: FormData) {
  const user = await requireTenantAdminOrSiteLead();
  const parsed = requestSchema.parse({
    facilityId: formData.get("facilityId"),
    fullName: formData.get("fullName"),
    idType: formData.get("idType") || undefined,
    idNumber: formData.get("idNumber") || undefined,
    company: formData.get("company") || undefined,
    accessLevel: formData.get("accessLevel"),
    reason: formData.get("reason"),
    validUntil: formData.get("validUntil") || undefined,
  });

  const siteEnrollment = await prisma.siteEnrollment.findFirst({
    where: { enterpriseAccountId: user.enterpriseAccountId, facilityId: parsed.facilityId },
  });
  if (!siteEnrollment || !(await assertSiteEnrollmentAccess(user, siteEnrollment.id))) {
    throw new Error("You do not have access to that site.");
  }

  await prisma.authorizedAccessEntry.create({
    data: {
      enterpriseAccountId: user.enterpriseAccountId,
      facilityId: parsed.facilityId,
      fullName: parsed.fullName,
      idType: parsed.idType || null,
      idNumber: parsed.idNumber || null,
      company: parsed.company || null,
      accessLevel: parsed.accessLevel,
      reason: parsed.reason,
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
      requestedById: user.id,
    },
  });

  revalidatePath("/portal/aal");
  revalidatePath("/ops/aal");
}

async function requireAalDecisionMaker() {
  const user = await requireInternalUser();
  const allowed: string[] = [ROLES.SYS_ADMIN, ROLES.OPS_SITE_MANAGER];
  if (!allowed.includes(user.role)) throw new Error("You do not have permission to decide AAL requests.");
  return user;
}

export async function decideAalEntry(entryId: string, decision: "Active" | "Rejected", formData: FormData) {
  const user = await requireAalDecisionMaker();
  const decisionNotes = String(formData.get("decisionNotes") ?? "").trim() || null;

  const entry = await prisma.authorizedAccessEntry.update({
    where: { id: entryId },
    data: { status: decision, decidedById: user.id, decidedAt: new Date(), decisionNotes },
  });

  await notifyFacilityTenantUsers(entry.facilityId, {
    title: `Authorized access ${decision === "Active" ? "approved" : "rejected"}: ${entry.fullName}`,
    body: decisionNotes ?? (decision === "Active" ? "Permanent access has been granted." : "The request was not approved."),
    category: "aal",
    linkUrl: "/portal/aal",
  });

  await logAudit({
    actorId: user.id,
    action: `aal.${decision === "Active" ? "approve" : "reject"}`,
    summary: `${decision === "Active" ? "Approved" : "Rejected"} AAL request for ${entry.fullName}.`,
    targetType: "AuthorizedAccessEntry",
    targetId: entry.id,
  });

  revalidatePath("/ops/aal");
  revalidatePath("/portal/aal");
}

export async function revokeAalEntry(entryId: string, formData: FormData) {
  const user = await requireAalDecisionMaker();
  const decisionNotes = String(formData.get("decisionNotes") ?? "").trim() || null;

  const entry = await prisma.authorizedAccessEntry.update({
    where: { id: entryId },
    data: { status: "Revoked", decidedById: user.id, decidedAt: new Date(), decisionNotes },
  });

  await notifyFacilityTenantUsers(entry.facilityId, {
    title: `Authorized access revoked: ${entry.fullName}`,
    body: decisionNotes ?? "This person's permanent access has been revoked.",
    category: "aal",
    linkUrl: "/portal/aal",
  });

  await logAudit({ actorId: user.id, action: "aal.revoke", summary: `Revoked AAL access for ${entry.fullName}.`, targetType: "AuthorizedAccessEntry", targetId: entry.id });
  revalidatePath("/ops/aal");
  revalidatePath("/portal/aal");
}
