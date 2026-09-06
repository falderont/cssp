"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireInternalUser } from "@/lib/session";

const schema = z.object({
  vendor: z.string().optional(),
  status: z.enum(["NotConfigured", "Connected", "Error"]),
});

export async function updateTelemetrySource(facilityId: string, returnPath: string, formData: FormData) {
  await requireInternalUser();
  const parsed = schema.parse({
    vendor: formData.get("vendor") || undefined,
    status: formData.get("status"),
  });

  await prisma.telemetrySource.upsert({
    where: { facilityId },
    create: {
      facilityId,
      vendor: parsed.vendor || null,
      status: parsed.status,
      lastSyncAt: parsed.status === "Connected" ? new Date() : null,
    },
    update: {
      vendor: parsed.vendor || null,
      status: parsed.status,
      lastSyncAt: parsed.status === "Connected" ? new Date() : null,
    },
  });

  revalidatePath(returnPath);
}
