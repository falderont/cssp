"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireInternalUser } from "@/lib/session";
import { ENGAGEMENT_TYPES } from "@/lib/constants";

const schema = z.object({
  enterpriseAccountId: z.string().min(1),
  type: z.enum(ENGAGEMENT_TYPES),
  notes: z.string().min(1),
  occurredAt: z.string().optional(),
});

export async function logEngagement(formData: FormData) {
  const user = await requireInternalUser();
  const parsed = schema.parse({
    enterpriseAccountId: formData.get("enterpriseAccountId"),
    type: formData.get("type"),
    notes: formData.get("notes"),
    occurredAt: formData.get("occurredAt") || undefined,
  });

  await prisma.engagementLog.create({
    data: {
      enterpriseAccountId: parsed.enterpriseAccountId,
      repId: user.id,
      type: parsed.type,
      notes: parsed.notes,
      occurredAt: parsed.occurredAt ? new Date(parsed.occurredAt) : new Date(),
    },
  });

  revalidatePath("/ops/cs-performance");
}
