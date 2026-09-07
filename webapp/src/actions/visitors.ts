"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser, requireInternalUser } from "@/lib/session";
import { assertSiteEnrollmentAccess } from "@/lib/scope";
import { pushVisitorRequestToAcs } from "@/lib/acs";
import { notifyFacilityTenantUsers } from "@/lib/notify";
import { checkBlacklist } from "@/lib/blacklist";
import { parseVisitorRowsFromFile, type VisitorImportRow } from "@/lib/visitor-import";

const visitorRowSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  idType: z.string().optional().default(""),
  idNumber: z.string().optional().default(""),
  company: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});

const requestSchema = z.object({
  siteEnrollmentId: z.string().min(1),
  buildingId: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  visitDate: z.string().min(1, "Visit date is required"),
  windowStart: z.string().min(1),
  windowEnd: z.string().min(1),
  hostUserId: z.string().optional(),
  visitors: z.array(visitorRowSchema).min(1, "Add at least one visitor"),
});

const batchRequestSchema = z.object({
  siteEnrollmentId: z.string().min(1, "Site is required"),
  buildingId: z.string().optional(),
  purpose: z.string().optional().default(""),
  visitDate: z.string().min(1, "Visit date is required"),
  windowStart: z.string().min(1, "Window start is required"),
  windowEnd: z.string().min(1, "Window end is required"),
  hostUserId: z.string().optional(),
});

// The blacklist is the automated first layer, checked for every row before a
// visitor ever reaches the ops approval queue — see BlacklistEntry in
// prisma/schema.prisma.
async function screenRow(row: VisitorImportRow | z.infer<typeof visitorRowSchema>) {
  const match = await checkBlacklist(row.fullName, row.idNumber || undefined);
  return {
    fullName: row.fullName,
    idType: row.idType || null,
    idNumber: row.idNumber || null,
    company: row.company || null,
    email: row.email || null,
    phone: row.phone || null,
    status: match ? "Blacklisted" : "Pending",
    isBlacklistMatch: !!match,
    blacklistReason: match?.reason ?? null,
  };
}

export async function createVisitorRequest(formData: FormData) {
  const user = await requireCustomerUser();

  const raw = {
    siteEnrollmentId: String(formData.get("siteEnrollmentId") ?? ""),
    buildingId: String(formData.get("buildingId") ?? "") || undefined,
    purpose: String(formData.get("purpose") ?? ""),
    visitDate: String(formData.get("visitDate") ?? ""),
    windowStart: String(formData.get("windowStart") ?? ""),
    windowEnd: String(formData.get("windowEnd") ?? ""),
    hostUserId: String(formData.get("hostUserId") ?? "") || undefined,
    visitors: JSON.parse(String(formData.get("visitorsJson") ?? "[]")),
  };

  const parsed = requestSchema.parse(raw);

  const hasAccess = await assertSiteEnrollmentAccess(user, parsed.siteEnrollmentId);
  if (!hasAccess) throw new Error("You do not have access to that site.");

  const screenedVisitors = await Promise.all(parsed.visitors.map(screenRow));

  const visitorRequest = await prisma.visitorRequest.create({
    data: {
      siteEnrollmentId: parsed.siteEnrollmentId,
      buildingId: parsed.buildingId || null,
      purpose: parsed.purpose,
      visitDate: new Date(parsed.visitDate),
      windowStart: parsed.windowStart,
      windowEnd: parsed.windowEnd,
      hostUserId: parsed.hostUserId || null,
      isGroup: parsed.visitors.length > 1,
      source: "Single",
      createdById: user.id,
      visitors: { create: screenedVisitors },
    },
  });

  revalidatePath("/portal/visitors");
  redirect(`/portal/visitors/${visitorRequest.id}`);
}

export async function createVisitorRequestBatch(formData: FormData) {
  const user = await requireCustomerUser();

  const parsed = batchRequestSchema.parse({
    siteEnrollmentId: String(formData.get("siteEnrollmentId") ?? ""),
    buildingId: String(formData.get("buildingId") ?? "") || undefined,
    purpose: String(formData.get("purpose") ?? ""),
    visitDate: String(formData.get("visitDate") ?? ""),
    windowStart: String(formData.get("windowStart") ?? ""),
    windowEnd: String(formData.get("windowEnd") ?? ""),
    hostUserId: String(formData.get("hostUserId") ?? "") || undefined,
  });
  const file = formData.get("visitorFile");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Attach an Excel (.xlsx) or CSV file with your visitor list.");
  }

  const hasAccess = await assertSiteEnrollmentAccess(user, parsed.siteEnrollmentId);
  if (!hasAccess) throw new Error("You do not have access to that site.");

  const rows = await parseVisitorRowsFromFile(file);
  if (rows.length === 0) {
    throw new Error("No valid rows found — check the fullName column is populated using the provided template.");
  }

  const screenedVisitors = await Promise.all(rows.map(screenRow));

  const visitorRequest = await prisma.visitorRequest.create({
    data: {
      siteEnrollmentId: parsed.siteEnrollmentId,
      buildingId: parsed.buildingId || null,
      purpose: parsed.purpose || "Group visit (batch upload)",
      visitDate: new Date(parsed.visitDate),
      windowStart: parsed.windowStart,
      windowEnd: parsed.windowEnd,
      hostUserId: parsed.hostUserId || null,
      isGroup: true,
      source: "Batch",
      createdById: user.id,
      visitors: { create: screenedVisitors },
    },
  });

  revalidatePath("/portal/visitors");
  redirect(`/portal/visitors/${visitorRequest.id}?imported=${rows.length}`);
}

export async function approveVisitor(visitorId: string, returnPath: string) {
  await requireInternalUser();
  const existing = await prisma.visitor.findUniqueOrThrow({ where: { id: visitorId } });
  if (existing.status === "Blacklisted") {
    throw new Error("This visitor is blacklisted — use the override action with a justification instead.");
  }
  const visitor = await prisma.visitor.update({ where: { id: visitorId }, data: { status: "Approved" } });
  await pushVisitorRequestToAcs(visitor.visitorRequestId);
  await notifyRequestOwner(visitor.visitorRequestId, "Visitor approved", `${visitor.fullName} was approved and synced to access control.`);
  revalidatePath(returnPath);
}

export async function overrideApproveBlacklistedVisitor(visitorId: string, returnPath: string, formData: FormData) {
  const user = await requireInternalUser();
  const overrideReason = String(formData.get("overrideReason") ?? "").trim();
  if (!overrideReason) throw new Error("An override justification is required.");

  const existing = await prisma.visitor.findUniqueOrThrow({ where: { id: visitorId } });
  const visitor = await prisma.visitor.update({
    where: { id: visitorId },
    data: {
      status: "Approved",
      blacklistReason: `${existing.blacklistReason ?? "Blacklist match"} — overridden by ${user.name ?? user.email}: ${overrideReason}`,
    },
  });
  await pushVisitorRequestToAcs(visitor.visitorRequestId);
  await notifyRequestOwner(visitor.visitorRequestId, "Visitor approved (override)", `${visitor.fullName} was approved despite a blacklist match, with justification on file.`);
  revalidatePath(returnPath);
}

export async function denyVisitor(visitorId: string, returnPath: string) {
  await requireInternalUser();
  const visitor = await prisma.visitor.update({ where: { id: visitorId }, data: { status: "Denied" } });
  await notifyRequestOwner(visitor.visitorRequestId, "Visitor denied", `${visitor.fullName}'s visit request was denied.`);
  revalidatePath(returnPath);
}

export async function approveAllVisitors(visitorRequestId: string, returnPath: string) {
  await requireInternalUser();
  await prisma.visitor.updateMany({ where: { visitorRequestId, status: "Pending" }, data: { status: "Approved" } });
  await pushVisitorRequestToAcs(visitorRequestId);
  await notifyRequestOwner(visitorRequestId, "Visitors approved", "All pending visitors on this request were approved and synced to access control.");
  revalidatePath(returnPath);
}

export async function checkInVisitor(visitorId: string, returnPath: string) {
  await requireInternalUser();
  await prisma.visitor.update({ where: { id: visitorId }, data: { status: "CheckedIn", checkedInAt: new Date() } });
  revalidatePath(returnPath);
}

export async function checkOutVisitor(visitorId: string, returnPath: string) {
  await requireInternalUser();
  await prisma.visitor.update({ where: { id: visitorId }, data: { status: "CheckedOut", checkedOutAt: new Date() } });
  revalidatePath(returnPath);
}

export async function retrySyncAcs(visitorRequestId: string, returnPath: string) {
  await requireInternalUser();
  await pushVisitorRequestToAcs(visitorRequestId);
  revalidatePath(returnPath);
}

async function notifyRequestOwner(visitorRequestId: string, title: string, body: string) {
  const vr = await prisma.visitorRequest.findUnique({
    where: { id: visitorRequestId },
    include: { siteEnrollment: true },
  });
  if (!vr) return;
  await notifyFacilityTenantUsers(vr.siteEnrollment.facilityId, {
    title,
    body,
    category: "visitor",
    linkUrl: `/portal/visitors/${visitorRequestId}`,
  });
}
