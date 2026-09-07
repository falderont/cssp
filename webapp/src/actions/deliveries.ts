"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser, requireInternalUser } from "@/lib/session";
import { assertSiteEnrollmentAccess } from "@/lib/scope";
import { notifyFacilityTenantUsers } from "@/lib/notify";

const expectedSchema = z.object({
  siteEnrollmentId: z.string().min(1),
  courierName: z.string().min(1),
  trackingNumber: z.string().optional(),
  description: z.string().min(1),
  recipientName: z.string().optional(),
  expectedAt: z.string().optional(),
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
  });

  const enrollment = await prisma.siteEnrollment.findUnique({ where: { id: parsed.siteEnrollmentId } });
  if (!enrollment) throw new Error("Site not found.");
  const hasAccess = await assertSiteEnrollmentAccess(user, parsed.siteEnrollmentId);
  if (!hasAccess) throw new Error("You do not have access to that site.");

  await prisma.delivery.create({
    data: {
      facilityId: enrollment.facilityId,
      enterpriseAccountId: enrollment.enterpriseAccountId,
      courierName: parsed.courierName,
      trackingNumber: parsed.trackingNumber || null,
      description: parsed.description,
      recipientName: parsed.recipientName || null,
      expectedAt: parsed.expectedAt ? new Date(parsed.expectedAt) : null,
      status: "Expected",
      createdById: user.id,
    },
  });

  revalidatePath("/portal/deliveries");
  redirect("/portal/deliveries");
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
