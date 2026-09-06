"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { resolvePortalScope } from "@/lib/portal-scope";

const RegisterVisitorSchema = z
  .object({
    siteEnrollmentId: z.string().min(1),
    visitorName: z.string().trim().min(1, "Visitor name is required."),
    visitorCompany: z.string().trim().optional(),
    visitStart: z.string().min(1, "Visit start is required."),
    visitEnd: z.string().min(1, "Visit end is required."),
  })
  .refine((v) => new Date(v.visitEnd) >= new Date(v.visitStart), {
    message: "Visit end must be on or after visit start.",
    path: ["visitEnd"],
  });

export type RegisterVisitorState = { error?: string } | undefined;

export async function registerVisitor(_prev: RegisterVisitorState, formData: FormData): Promise<RegisterVisitorState> {
  const session = await requireSession();
  const parsed = RegisterVisitorSchema.safeParse({
    siteEnrollmentId: formData.get("siteEnrollmentId"),
    visitorName: formData.get("visitorName"),
    visitorCompany: formData.get("visitorCompany") || undefined,
    visitStart: formData.get("visitStart"),
    visitEnd: formData.get("visitEnd"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session);
    if (!scope.enrollments.some((e) => e.id === parsed.data.siteEnrollmentId)) {
      throw new Error("You don't have access to that site.");
    }
    await tx.visitor.create({
      data: {
        organizationId: session.organizationId,
        siteEnrollmentId: parsed.data.siteEnrollmentId,
        visitorName: parsed.data.visitorName,
        visitorCompany: parsed.data.visitorCompany,
        hostUserId: session.userId,
        visitStart: new Date(parsed.data.visitStart),
        visitEnd: new Date(parsed.data.visitEnd),
        status: "PENDING",
      },
    });
  });

  revalidatePath("/portal/visitors");
  return undefined;
}
