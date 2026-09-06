"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInternalUser } from "@/lib/session";
import { saveUploadedFile } from "@/lib/storage";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";

const schema = z.object({
  title: z.string().min(1),
  category: z.enum(DOCUMENT_CATEGORIES),
  enterpriseAccountId: z.string().optional(),
  facilityId: z.string().optional(),
});

export async function publishDocument(formData: FormData) {
  const user = await requireInternalUser();
  const parsed = schema.parse({
    title: formData.get("title"),
    category: formData.get("category"),
    enterpriseAccountId: formData.get("enterpriseAccountId") || undefined,
    facilityId: formData.get("facilityId") || undefined,
  });
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Attach a file to publish.");

  const saved = await saveUploadedFile(file, "documents");

  await prisma.document.create({
    data: {
      title: parsed.title,
      category: parsed.category,
      enterpriseAccountId: parsed.enterpriseAccountId || null,
      facilityId: parsed.facilityId || null,
      fileName: saved.fileName,
      storageKey: saved.storageKey,
      mimeType: saved.mimeType,
      fileSizeKb: saved.fileSizeKb,
      publishedById: user.id,
    },
  });

  revalidatePath("/ops/documents");
  redirect("/ops/documents");
}

export async function deleteDocument(id: string, returnPath: string) {
  await requireInternalUser();
  await prisma.document.delete({ where: { id } });
  revalidatePath(returnPath);
}
