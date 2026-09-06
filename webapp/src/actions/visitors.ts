"use server";

import { z } from "zod";
import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser, requireInternalUser } from "@/lib/session";
import { assertSiteEnrollmentAccess } from "@/lib/scope";
import { pushVisitorRequestToAcs } from "@/lib/acs";
import { notifyFacilityTenantUsers } from "@/lib/notify";

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
      visitors: {
        create: parsed.visitors.map((v) => ({
          fullName: v.fullName,
          idType: v.idType || null,
          idNumber: v.idNumber || null,
          company: v.company || null,
          email: v.email || null,
          phone: v.phone || null,
        })),
      },
    },
  });

  revalidatePath("/portal/visitors");
  redirect(`/portal/visitors/${visitorRequest.id}`);
}

export async function createVisitorRequestBatch(formData: FormData) {
  const user = await requireCustomerUser();

  const siteEnrollmentId = String(formData.get("siteEnrollmentId") ?? "");
  const buildingId = String(formData.get("buildingId") ?? "") || undefined;
  const purpose = String(formData.get("purpose") ?? "");
  const visitDate = String(formData.get("visitDate") ?? "");
  const windowStart = String(formData.get("windowStart") ?? "");
  const windowEnd = String(formData.get("windowEnd") ?? "");
  const file = formData.get("csvFile");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Attach a CSV file with your visitor list.");
  }

  const hasAccess = await assertSiteEnrollmentAccess(user, siteEnrollmentId);
  if (!hasAccess) throw new Error("You do not have access to that site.");

  const text = await file.text();
  const parsedCsv = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const rows = parsedCsv.data
    .map((r) => ({
      fullName: (r.fullName || r.name || "").trim(),
      idType: (r.idType || "").trim(),
      idNumber: (r.idNumber || "").trim(),
      company: (r.company || "").trim(),
      email: (r.email || "").trim(),
      phone: (r.phone || "").trim(),
    }))
    .filter((r) => r.fullName.length > 0);

  if (rows.length === 0) {
    throw new Error("No valid rows found in the CSV — check the fullName column is populated.");
  }

  const visitorRequest = await prisma.visitorRequest.create({
    data: {
      siteEnrollmentId,
      buildingId: buildingId || null,
      purpose: purpose || "Group visit (batch upload)",
      visitDate: new Date(visitDate),
      windowStart,
      windowEnd,
      isGroup: true,
      source: "Batch",
      createdById: user.id,
      visitors: {
        create: rows.map((v) => ({
          fullName: v.fullName,
          idType: v.idType || null,
          idNumber: v.idNumber || null,
          company: v.company || null,
          email: v.email || null,
          phone: v.phone || null,
        })),
      },
    },
  });

  revalidatePath("/portal/visitors");
  redirect(`/portal/visitors/${visitorRequest.id}?imported=${rows.length}`);
}

export async function approveVisitor(visitorId: string, returnPath: string) {
  await requireInternalUser();
  const visitor = await prisma.visitor.update({ where: { id: visitorId }, data: { status: "Approved" } });
  await pushVisitorRequestToAcs(visitor.visitorRequestId);
  await notifyRequestOwner(visitor.visitorRequestId, "Visitor approved", `${visitor.fullName} was approved and synced to access control.`);
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
