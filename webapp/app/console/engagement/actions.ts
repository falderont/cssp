"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canLogEngagement, assert } from "@/lib/rbac";

const LogSchema = z.object({
  enterpriseAccountId: z.string().min(1),
  type: z.enum(["CALL", "EMAIL", "MEETING", "SITE_VISIT"]),
  notes: z.string().trim().min(1, "Notes are required."),
});

export type LogEngagementState = { error?: string } | undefined;

export async function logEngagement(_prev: LogEngagementState, formData: FormData): Promise<LogEngagementState> {
  const session = await requireSession();
  assert(canLogEngagement(session.role), "You don't have permission to log engagement.");

  const parsed = LogSchema.safeParse({
    enterpriseAccountId: formData.get("enterpriseAccountId"),
    type: formData.get("type"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await withTenant(session.organizationId, (tx) =>
    tx.engagementLog.create({
      data: {
        organizationId: session.organizationId,
        enterpriseAccountId: parsed.data.enterpriseAccountId,
        loggedByUserId: session.userId,
        type: parsed.data.type,
        notes: parsed.data.notes,
      },
    }),
  );

  revalidatePath("/console/engagement");
  return undefined;
}
