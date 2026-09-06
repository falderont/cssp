"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canTriageTickets, assert } from "@/lib/rbac";
import type { TicketStatus } from "@/lib/generated/prisma/client";

export async function updateTicketStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  assert(canTriageTickets(session.role));
  const ticketId = formData.get("ticketId");
  const status = formData.get("status");
  if (typeof ticketId !== "string" || typeof status !== "string") throw new Error("Invalid request.");

  await withTenant(session.organizationId, async (tx) => {
    const wasAlreadyClosed = ["RESOLVED", "CLOSED"].includes(
      (await tx.ticket.findUniqueOrThrow({ where: { id: ticketId }, select: { status: true } })).status,
    );
    const ticket = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: status as TicketStatus,
        resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
      },
      include: { siteEnrollment: true },
    });

    // Auto-log to CS Engagement, once, the first time a ticket is resolved/closed —
    // see docs/prd-v3.md Section 5: "isn't double-entry."
    if (!wasAlreadyClosed && (status === "RESOLVED" || status === "CLOSED") && ticket.assignedToUserId) {
      await tx.engagementLog.create({
        data: {
          organizationId: session.organizationId,
          enterpriseAccountId: ticket.siteEnrollment.enterpriseAccountId,
          siteEnrollmentId: ticket.siteEnrollmentId,
          loggedByUserId: ticket.assignedToUserId,
          type: "TICKET",
          notes: `Ticket auto-logged: resolved "${ticket.subject}".`,
          linkedTicketId: ticket.id,
        },
      });
    }
  });

  revalidatePath("/console/tickets");
  revalidatePath("/portal/tickets");
  revalidatePath("/console/engagement");
}

export async function assignTicket(formData: FormData): Promise<void> {
  const session = await requireSession();
  assert(canTriageTickets(session.role));
  const ticketId = formData.get("ticketId");
  const assignedToUserId = formData.get("assignedToUserId");
  if (typeof ticketId !== "string" || typeof assignedToUserId !== "string") throw new Error("Invalid request.");

  await withTenant(session.organizationId, (tx) =>
    tx.ticket.update({
      where: { id: ticketId },
      data: { assignedToUserId: assignedToUserId || null, status: "IN_PROGRESS" },
    }),
  );

  revalidatePath("/console/tickets");
}
