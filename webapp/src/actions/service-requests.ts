"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser, requireInternalUser } from "@/lib/session";
import { assertSiteEnrollmentAccess } from "@/lib/scope";
import { notifyFacilityTenantUsers } from "@/lib/notify";
import { saveUploadedFile, saveGeneratedFile } from "@/lib/storage";
import { makePdfWithImage } from "@/lib/pdf";
import {
  SERVICE_REQUEST_CATEGORIES,
  SERVICE_REQUEST_PRIORITIES,
  SERVICE_REQUEST_STATUSES,
  REMOTE_HANDS_TASK_LABELS,
  SERVICE_REQUEST_CATEGORY_LABELS,
} from "@/lib/constants";

const createSchema = z.object({
  siteEnrollmentId: z.string().min(1),
  buildingId: z.string().optional(),
  category: z.enum(SERVICE_REQUEST_CATEGORIES),
  subject: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(SERVICE_REQUEST_PRIORITIES),
  taskType: z.string().optional(),
  assetRef: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
});

export async function createServiceRequest(formData: FormData) {
  const user = await requireCustomerUser();
  const parsed = createSchema.parse({
    siteEnrollmentId: formData.get("siteEnrollmentId"),
    buildingId: formData.get("buildingId") || undefined,
    category: formData.get("category"),
    subject: formData.get("subject"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    taskType: formData.get("taskType") || undefined,
    assetRef: formData.get("assetRef") || undefined,
    scheduledStart: formData.get("scheduledStart") || undefined,
    scheduledEnd: formData.get("scheduledEnd") || undefined,
  });

  const hasAccess = await assertSiteEnrollmentAccess(user, parsed.siteEnrollmentId);
  if (!hasAccess) throw new Error("You do not have access to that site.");

  if (parsed.category === "RemoteHands" && (!parsed.taskType || !parsed.assetRef)) {
    throw new Error("Remote hands requests need a task type and an asset/rack reference.");
  }
  if ((parsed.category === "SiteWalkEscort" || parsed.category === "GeneralMeeting") && !parsed.scheduledStart) {
    throw new Error("Pick a date and time for this request.");
  }

  const request = await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: parsed.siteEnrollmentId,
      buildingId: parsed.buildingId || null,
      category: parsed.category,
      subject: parsed.subject,
      description: parsed.description,
      priority: parsed.priority,
      createdById: user.id,
      taskType: parsed.category === "RemoteHands" ? parsed.taskType : null,
      assetRef: parsed.category === "RemoteHands" ? parsed.assetRef : null,
      scheduledStart: parsed.scheduledStart ? new Date(parsed.scheduledStart) : null,
      scheduledEnd: parsed.scheduledEnd ? new Date(parsed.scheduledEnd) : parsed.scheduledStart ? new Date(parsed.scheduledStart) : null,
    },
  });

  revalidatePath("/portal/service-requests");
  redirect(`/portal/service-requests/${request.id}`);
}

async function notifyRequester(serviceRequestId: string, title: string, body: string) {
  const sr = await prisma.serviceRequest.findUnique({
    where: { id: serviceRequestId },
    include: { siteEnrollment: true },
  });
  if (!sr) return;
  await notifyFacilityTenantUsers(sr.siteEnrollment.facilityId, {
    title,
    body,
    category: "service_request",
    linkUrl: `/portal/service-requests/${serviceRequestId}`,
  });
}

async function autoLogEngagement(serviceRequestId: string) {
  const sr = await prisma.serviceRequest.findUniqueOrThrow({
    where: { id: serviceRequestId },
    include: { siteEnrollment: true },
  });
  if (!sr.assignedToId) return;
  const existing = await prisma.engagementLog.findFirst({ where: { linkedServiceRequestId: serviceRequestId } });
  if (existing) return;
  const label = SERVICE_REQUEST_CATEGORY_LABELS[sr.category] ?? sr.category;
  await prisma.engagementLog.create({
    data: {
      enterpriseAccountId: sr.siteEnrollment.enterpriseAccountId,
      repId: sr.assignedToId,
      type: "service_request",
      notes: `Auto-logged from completed request "${sr.subject}" (${label}).`,
      linkedServiceRequestId: serviceRequestId,
      occurredAt: sr.resolvedAt ?? new Date(),
    },
  });
}

export async function assignServiceRequest(id: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  const request = await prisma.serviceRequest.update({
    where: { id },
    data: { assignedToId, status: "Accepted" },
  });
  await notifyRequester(id, "Request accepted", `"${request.subject}" has been accepted and assigned.`);
  revalidatePath(returnPath);
}

const statusSchema = z.enum(SERVICE_REQUEST_STATUSES);

export async function updateServiceRequestStatus(id: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const status = statusSchema.parse(formData.get("status"));

  const request = await prisma.serviceRequest.update({
    where: { id },
    data: { status, resolvedAt: status === "Done" ? new Date() : null },
  });

  if (status === "Done") await autoLogEngagement(id);
  await notifyRequester(id, `Request update: ${request.subject}`, `Status changed to ${status}.`);
  revalidatePath(returnPath);
}

export async function startServiceRequest(id: string, returnPath: string) {
  await requireInternalUser();
  const request = await prisma.serviceRequest.update({
    where: { id },
    data: { status: "InProgress", startedAt: new Date() },
  });
  await notifyRequester(id, "Technician on the way", `Work has started on "${request.subject}".`);
  revalidatePath(returnPath);
}

export async function completeServiceRequest(id: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const completionNotes = String(formData.get("completionNotes") ?? "");
  const billableMinutesOverride = formData.get("billableMinutesOverride");
  const photo = formData.get("completionPhoto");

  const existing = await prisma.serviceRequest.findUniqueOrThrow({ where: { id } });
  const completedAt = new Date();
  const autoMinutes = existing.startedAt
    ? Math.max(1, Math.round((completedAt.getTime() - existing.startedAt.getTime()) / 60000))
    : 15;
  const billableMinutes =
    billableMinutesOverride && String(billableMinutesOverride).trim() !== "" ? Number(billableMinutesOverride) : autoMinutes;

  let completionPhotoUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    const saved = await saveUploadedFile(photo, "photos");
    completionPhotoUrl = saved.storageKey;
  }

  const request = await prisma.serviceRequest.update({
    where: { id },
    data: {
      status: "Done",
      completedAt,
      resolvedAt: completedAt,
      billableMinutes,
      completionNotes,
      ...(completionPhotoUrl ? { completionPhotoUrl } : {}),
    },
  });

  await autoLogEngagement(id);
  await notifyRequester(
    id,
    "Remote hands task completed",
    `"${request.assetRef ?? request.subject}" is complete. View the technician's notes, completion proof, and sign your acceptance.`
  );
  revalidatePath(returnPath);
}

export async function submitServiceRequestCsat(id: string, rating: "up" | "down", returnPath: string) {
  await requireCustomerUser();
  await prisma.serviceRequest.update({ where: { id }, data: { csatRating: rating } });
  revalidatePath(returnPath);
}

const signOffSchema = z.object({
  signOffName: z.string().min(1),
  signOffTitle: z.string().min(1),
  signatureDataUrl: z.string().min(1),
  signatureWidth: z.coerce.number().positive(),
  signatureHeight: z.coerce.number().positive(),
});

export async function submitSignOff(id: string, returnPath: string, formData: FormData) {
  const user = await requireCustomerUser();
  const parsed = signOffSchema.parse({
    signOffName: formData.get("signOffName"),
    signOffTitle: formData.get("signOffTitle"),
    signatureDataUrl: formData.get("signatureDataUrl"),
    signatureWidth: formData.get("signatureWidth"),
    signatureHeight: formData.get("signatureHeight"),
  });

  const request = await prisma.serviceRequest.findUniqueOrThrow({
    where: { id },
    include: { siteEnrollment: { include: { enterpriseAccount: true, facility: true } } },
  });
  if (request.siteEnrollment.enterpriseAccountId !== user.enterpriseAccountId) {
    throw new Error("You do not have access to that request.");
  }
  if (request.category !== "RemoteHands" || request.status !== "Done") {
    throw new Error("Sign-off is only available for completed remote hands requests.");
  }

  const match = /^data:image\/jpeg;base64,(.+)$/.exec(parsed.signatureDataUrl);
  if (!match) throw new Error("Invalid signature image.");
  const jpegBuffer = Buffer.from(match[1], "base64");

  const signedAt = new Date();
  const pdf = makePdfWithImage(
    "Remote Hands — Sign-off / Acceptance Certificate",
    [
      `Tenant: ${request.siteEnrollment.enterpriseAccount.name}`,
      `Facility: ${request.siteEnrollment.facility.name}`,
      `Task: ${(request.taskType && REMOTE_HANDS_TASK_LABELS[request.taskType]) || request.taskType || ""}`,
      `Asset / rack: ${request.assetRef ?? "—"}`,
      `Description: ${request.description}`,
      `Completion notes: ${request.completionNotes ?? "—"}`,
      `Billable minutes: ${request.billableMinutes ?? "—"}`,
      "",
      "Customer acceptance:",
      `Signed by: ${parsed.signOffName}`,
      `Title: ${parsed.signOffTitle}`,
      `Date: ${signedAt.toLocaleString()}`,
    ],
    { jpegBuffer, widthPx: parsed.signatureWidth, heightPx: parsed.signatureHeight }
  );

  const fileName = `signoff-${id}.pdf`;
  const storageKey = await saveGeneratedFile(pdf, `signoffs/${fileName}`);

  await prisma.serviceRequest.update({
    where: { id },
    data: {
      signOffName: parsed.signOffName,
      signOffTitle: parsed.signOffTitle,
      signOffSignedAt: signedAt,
      signOffPdfStorageKey: storageKey,
    },
  });

  // Also publish it to the Download Center so finance can attach the same
  // signed document to billing without hunting through the request queue.
  await prisma.document.create({
    data: {
      enterpriseAccountId: request.siteEnrollment.enterpriseAccountId,
      facilityId: request.siteEnrollment.facilityId,
      title: `Remote Hands Sign-off — ${request.assetRef ?? request.subject} — ${signedAt.toLocaleDateString()}`,
      category: "Other",
      fileName,
      storageKey,
      mimeType: "application/pdf",
      fileSizeKb: Math.max(1, Math.round(pdf.byteLength / 1024)),
      publishedById: user.id,
    },
  });

  revalidatePath(returnPath);
  revalidatePath("/portal/documents");
}
