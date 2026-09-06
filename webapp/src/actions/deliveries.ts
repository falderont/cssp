"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser, requireInternalUser } from "@/lib/session";
import { assertSiteEnrollmentAccess } from "@/lib/scope";
import { notifyFacilityTenantUsers } from "@/lib/notify";
import { DELIVERY_STATUSES } from "@/lib/constants";

const expectedSchema = z.object({
  siteEnrollmentId: z.string().min(1),
  courierName: z.string().min(1),
  trackingNumber: z.string().optional(),
  description: z.string().min(1),
  recipientName: z.string().optional(),
  expectedAt: z.string().optional(),
});

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

const logSchema = z.object({
  facilityId: z.string().min(1),
  enterpriseAccountId: z.string().optional(),
  courierName: z.string().min(1),
  trackingNumber: z.string().optional(),
  description: z.string().min(1),
  recipientName: z.string().optional(),
});

export async function logDeliveryArrival(formData: FormData) {
  const user = await requireInternalUser();
  const parsed = logSchema.parse({
    facilityId: formData.get("facilityId"),
    enterpriseAccountId: formData.get("enterpriseAccountId") || undefined,
    courierName: formData.get("courierName"),
    trackingNumber: formData.get("trackingNumber") || undefined,
    description: formData.get("description"),
    recipientName: formData.get("recipientName") || undefined,
  });

  const delivery = await prisma.delivery.create({
    data: {
      facilityId: parsed.facilityId,
      enterpriseAccountId: parsed.enterpriseAccountId || null,
      courierName: parsed.courierName,
      trackingNumber: parsed.trackingNumber || null,
      description: parsed.description,
      recipientName: parsed.recipientName || null,
      status: "Arrived",
      arrivedAt: new Date(),
      createdById: user.id,
    },
  });

  if (delivery.enterpriseAccountId) {
    await notifyFacilityTenantUsers(delivery.facilityId, {
      title: "A delivery has arrived",
      body: `${delivery.courierName}: ${delivery.description}`,
      category: "delivery",
      linkUrl: "/portal/deliveries",
    });
  }

  revalidatePath("/ops/deliveries");
}

const statusSchema = z.enum(DELIVERY_STATUSES);

export async function updateDeliveryStatus(id: string, returnPath: string, formData: FormData) {
  const user = await requireInternalUser();
  const status = statusSchema.parse(formData.get("status"));

  const delivery = await prisma.delivery.update({
    where: { id },
    data: {
      status,
      ...(status === "Arrived" ? { arrivedAt: new Date() } : {}),
      ...(status === "Received" ? { receivedAt: new Date(), receivedById: user.id } : {}),
    },
  });

  if (delivery.enterpriseAccountId && (status === "Arrived" || status === "Received")) {
    await notifyFacilityTenantUsers(delivery.facilityId, {
      title: status === "Arrived" ? "A delivery has arrived" : "A delivery was received on your behalf",
      body: `${delivery.courierName}: ${delivery.description}`,
      category: "delivery",
      linkUrl: "/portal/deliveries",
    });
  }

  revalidatePath(returnPath);
}
