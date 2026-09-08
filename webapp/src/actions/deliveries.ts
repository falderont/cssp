"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser, requireInternalUser } from "@/lib/session";
import { assertSiteEnrollmentAccess, getCustomerFacilityIds } from "@/lib/scope";
import { notifyFacilityTenantUsers } from "@/lib/notify";
import { saveUploadedFile } from "@/lib/storage";
import { isDeliveryEditable } from "@/lib/deliveries";

const expectedSchema = z.object({
  siteEnrollmentId: z.string().min(1),
  courierName: z.string().min(1),
  trackingNumber: z.string().optional(),
  description: z.string().min(1),
  recipientName: z.string().optional(),
  expectedAt: z.string().optional(),
  loadingDockId: z.string().optional(),
});

// Deliveries are a request ticket into the VMS, the same shape as a
// VisitorRequest: the tenant is the only one who can submit one — ops never
// logs a delivery from scratch, it only processes a submitted ticket through
// to arrival/hand-off, or rejects it (see markDeliveryArrived,
// markDeliveryReceived and rejectDelivery below).
export async function createExpectedDelivery(formData: FormData) {
  const user = await requireCustomerUser();
  const parsed = expectedSchema.parse({
    siteEnrollmentId: formData.get("siteEnrollmentId"),
    courierName: formData.get("courierName"),
    trackingNumber: formData.get("trackingNumber") || undefined,
    description: formData.get("description"),
    recipientName: formData.get("recipientName") || undefined,
    expectedAt: formData.get("expectedAt") || undefined,
    loadingDockId: formData.get("loadingDockId") || undefined,
  });

  const enrollment = await prisma.siteEnrollment.findUnique({ where: { id: parsed.siteEnrollmentId } });
  if (!enrollment) throw new Error("Site not found.");
  const hasAccess = await assertSiteEnrollmentAccess(user, parsed.siteEnrollmentId);
  if (!hasAccess) throw new Error("You do not have access to that site.");
  const loadingDockId = await resolveLoadingDockId(parsed.loadingDockId, enrollment.facilityId);

  await prisma.delivery.create({
    data: {
      facilityId: enrollment.facilityId,
      enterpriseAccountId: enrollment.enterpriseAccountId,
      courierName: parsed.courierName,
      trackingNumber: parsed.trackingNumber || null,
      description: parsed.description,
      recipientName: parsed.recipientName || null,
      expectedAt: parsed.expectedAt ? new Date(parsed.expectedAt) : null,
      loadingDockId,
      status: "Expected",
      createdById: user.id,
    },
  });

  revalidatePath("/portal/deliveries");
  redirect("/portal/deliveries");
}

// A loading dock only makes sense scoped to the facility the delivery is
// actually going to — silently drop anything else instead of erroring, since
// this only ever reaches the action via a <select> populated server-side.
async function resolveLoadingDockId(loadingDockId: string | undefined, facilityId: string) {
  if (!loadingDockId) return null;
  const dock = await prisma.loadingDock.findUnique({ where: { id: loadingDockId } });
  return dock && dock.facilityId === facilityId ? dock.id : null;
}

const updateSchema = expectedSchema.omit({ siteEnrollmentId: true });

// Tenants can amend their own ticket's details up until ops has moved it past
// "Expected", or its expected date has passed (see isDeliveryEditable) — ops
// still processes the ticket through arrival/hand-off regardless of edits.
export async function updateDelivery(id: string, formData: FormData) {
  const user = await requireCustomerUser();
  const existing = await prisma.delivery.findUnique({ where: { id } });
  if (!existing || existing.enterpriseAccountId !== user.enterpriseAccountId) throw new Error("Delivery ticket not found.");
  const facilityIds = await getCustomerFacilityIds(user);
  if (!facilityIds.includes(existing.facilityId)) throw new Error("You do not have access to that site.");
  if (!isDeliveryEditable(existing)) throw new Error("This ticket can no longer be edited.");

  const parsed = updateSchema.parse({
    courierName: formData.get("courierName"),
    trackingNumber: formData.get("trackingNumber") || undefined,
    description: formData.get("description"),
    recipientName: formData.get("recipientName") || undefined,
    expectedAt: formData.get("expectedAt") || undefined,
    loadingDockId: formData.get("loadingDockId") || undefined,
  });
  const loadingDockId = await resolveLoadingDockId(parsed.loadingDockId, existing.facilityId);

  await prisma.delivery.update({
    where: { id },
    data: {
      courierName: parsed.courierName,
      trackingNumber: parsed.trackingNumber || null,
      description: parsed.description,
      recipientName: parsed.recipientName || null,
      expectedAt: parsed.expectedAt ? new Date(parsed.expectedAt) : null,
      loadingDockId,
    },
  });

  revalidatePath("/portal/deliveries");
  revalidatePath(`/portal/deliveries/${id}`);
  redirect(`/portal/deliveries/${id}`);
}

export async function markDeliveryArrived(id: string, returnPath: string) {
  await requireInternalUser();
  const delivery = await prisma.delivery.update({ where: { id }, data: { status: "Arrived", arrivedAt: new Date() } });

  await notifyFacilityTenantUsers(delivery.facilityId, {
    title: "A delivery has arrived",
    body: `${delivery.courierName}: ${delivery.description}`,
    category: "delivery",
    linkUrl: "/portal/deliveries",
  });

  revalidatePath(returnPath);
}

export async function markDeliveryReceived(id: string, returnPath: string) {
  const user = await requireInternalUser();
  const delivery = await prisma.delivery.update({
    where: { id },
    data: { status: "Received", receivedAt: new Date(), receivedById: user.id },
  });

  await notifyFacilityTenantUsers(delivery.facilityId, {
    title: "A delivery was received on your behalf",
    body: `${delivery.courierName}: ${delivery.description}`,
    category: "delivery",
    linkUrl: "/portal/deliveries",
  });

  revalidatePath(returnPath);
}

// Front office/security photo evidence that the arrival/hand-off actually
// happened — a delivery can carry more than one (package, dock, signed
// waybill, ...), so this appends rather than replaces.
export async function uploadDeliveryPhoto(deliveryId: string, returnPath: string, formData: FormData) {
  const user = await requireInternalUser();
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) throw new Error("Choose a photo to upload.");

  const saved = await saveUploadedFile(photo, "delivery-photos");
  await prisma.deliveryPhoto.create({
    data: { deliveryId, storageKey: saved.storageKey, uploadedById: user.id },
  });

  revalidatePath(returnPath);
}

export async function rejectDelivery(id: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const delivery = await prisma.delivery.update({ where: { id }, data: { status: "Rejected", notes } });

  await notifyFacilityTenantUsers(delivery.facilityId, {
    title: "A delivery was rejected",
    body: notes ?? `${delivery.courierName}: ${delivery.description}`,
    category: "delivery",
    linkUrl: "/portal/deliveries",
  });

  revalidatePath(returnPath);
}
