"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser, requireInternalUser } from "@/lib/session";
import { assertSiteEnrollmentAccess } from "@/lib/scope";
import { notifyFacilityTenantUsers } from "@/lib/notify";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/constants";

const createSchema = z.object({
  siteEnrollmentId: z.string().min(1),
  category: z.enum(TICKET_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES),
  subject: z.string().min(1),
  description: z.string().min(1),
});

export async function createTicket(formData: FormData) {
  const user = await requireCustomerUser();
  const parsed = createSchema.parse({
    siteEnrollmentId: formData.get("siteEnrollmentId"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    subject: formData.get("subject"),
    description: formData.get("description"),
  });

  const hasAccess = await assertSiteEnrollmentAccess(user, parsed.siteEnrollmentId);
  if (!hasAccess) throw new Error("You do not have access to that site.");

  const ticket = await prisma.ticket.create({
    data: { ...parsed, createdById: user.id },
  });

  revalidatePath("/portal/tickets");
  redirect(`/portal/tickets/${ticket.id}`);
}

export async function assignTicket(ticketId: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  await prisma.ticket.update({ where: { id: ticketId }, data: { assignedToId, status: "InProgress" } });
  revalidatePath(returnPath);
}

const statusSchema = z.enum(TICKET_STATUSES);

export async function updateTicketStatus(ticketId: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const status = statusSchema.parse(formData.get("status"));

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status, resolvedAt: status === "Done" ? new Date() : null },
    include: { siteEnrollment: true, createdByUser: true },
  });

  if (status === "Done" && ticket.assignedToId) {
    const existing = await prisma.engagementLog.findFirst({ where: { linkedTicketId: ticketId } });
    if (!existing) {
      await prisma.engagementLog.create({
        data: {
          enterpriseAccountId: ticket.siteEnrollment.enterpriseAccountId,
          repId: ticket.assignedToId,
          type: "ticket",
          notes: `Auto-logged from resolved ticket "${ticket.subject}" (${ticket.category}).`,
          linkedTicketId: ticketId,
        },
      });
    }
  }

  await notifyFacilityTenantUsers(ticket.siteEnrollment.facilityId, {
    title: `Ticket update: ${ticket.subject}`,
    body: `Status changed to ${status}.`,
    category: "ticket",
    linkUrl: `/portal/tickets/${ticketId}`,
  });

  revalidatePath(returnPath);
}

export async function submitTicketCsat(ticketId: string, rating: "up" | "down", returnPath: string) {
  await requireCustomerUser();
  await prisma.ticket.update({ where: { id: ticketId }, data: { csatRating: rating } });
  revalidatePath(returnPath);
}
