"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { resolvePortalScope } from "@/lib/portal-scope";
import { assert } from "@/lib/rbac";

const CreateTicketSchema = z.object({
  siteEnrollmentId: z.string().min(1),
  category: z.enum(["COMPLAINT", "RFI", "SERVICE_REQUEST"]),
  subject: z.string().trim().min(1, "Subject is required."),
  description: z.string().trim().min(1, "Description is required."),
});

export type CreateTicketState = { error?: string } | undefined;

export async function createTicket(_prev: CreateTicketState, formData: FormData): Promise<CreateTicketState> {
  const session = await requireSession();
  const parsed = CreateTicketSchema.safeParse({
    siteEnrollmentId: formData.get("siteEnrollmentId"),
    category: formData.get("category"),
    subject: formData.get("subject"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session);
    assert(scope.enrollments.some((e) => e.id === parsed.data.siteEnrollmentId), "You don't have access to that site.");
    await tx.ticket.create({
      data: {
        organizationId: session.organizationId,
        siteEnrollmentId: parsed.data.siteEnrollmentId,
        category: parsed.data.category,
        subject: parsed.data.subject,
        description: parsed.data.description,
        status: "OPEN",
        createdByUserId: session.userId,
      },
    });
  });

  revalidatePath("/portal/tickets");
  return undefined;
}

export async function rateTicket(formData: FormData): Promise<void> {
  const session = await requireSession();
  const ticketId = formData.get("ticketId");
  const rating = Number(formData.get("rating"));
  if (typeof ticketId !== "string" || !ticketId || !(rating >= 1 && rating <= 5)) {
    throw new Error("Invalid rating.");
  }

  await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session);
    const ticket = await tx.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    assert(scope.siteEnrollmentIds.includes(ticket.siteEnrollmentId) || scope.enrollments.some((e) => e.id === ticket.siteEnrollmentId));
    assert(["RESOLVED", "CLOSED"].includes(ticket.status), "Only resolved tickets can be rated.");
    assert(ticket.csatRating === null, "Already rated.");
    await tx.ticket.update({ where: { id: ticketId }, data: { csatRating: rating } });
  });

  revalidatePath("/portal/tickets");
}
