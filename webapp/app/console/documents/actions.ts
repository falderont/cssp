"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canPublishDocuments, assert } from "@/lib/rbac";
import { saveUploadedFile } from "@/lib/storage";

const PublishSchema = z.object({
  enterpriseAccountId: z.string().min(1),
  facilityId: z.string().optional(),
  title: z.string().trim().min(1, "Title is required."),
  category: z.enum(["SLA_REPORT", "COMPLIANCE_CERTIFICATE", "INVOICE_BACKUP", "RUNBOOK", "OTHER"]),
});

export type PublishDocumentState = { error?: string } | undefined;

export async function publishDocument(_prev: PublishDocumentState, formData: FormData): Promise<PublishDocumentState> {
  const session = await requireSession();
  assert(canPublishDocuments(session.role), "You don't have permission to publish documents.");

  const parsed = PublishSchema.safeParse({
    enterpriseAccountId: formData.get("enterpriseAccountId"),
    facilityId: (formData.get("facilityId") as string) || undefined,
    title: formData.get("title"),
    category: formData.get("category"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  const { fileRef, fileName, fileSize } = await saveUploadedFile(file, "documents");

  await withTenant(session.organizationId, (tx) =>
    tx.document.create({
      data: {
        organizationId: session.organizationId,
        enterpriseAccountId: parsed.data.enterpriseAccountId,
        facilityId: parsed.data.facilityId || null,
        title: parsed.data.title,
        category: parsed.data.category,
        fileRef,
        fileName,
        fileSize,
        publishedByUserId: session.userId,
      },
    }),
  );

  revalidatePath("/console/documents");
  revalidatePath("/portal/documents");
  return undefined;
}
