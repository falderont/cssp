"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSysAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { CHANGELOG_CATEGORIES } from "@/lib/constants";

const schema = z.object({
  title: z.string().min(1),
  version: z.string().optional(),
  category: z.enum(CHANGELOG_CATEGORIES),
  description: z.string().min(1),
});

function revalidateChangelogPaths() {
  revalidatePath("/ops/changelog");
  revalidatePath("/portal/changelog");
}

export async function createChangelogEntry(formData: FormData) {
  const admin = await requireSysAdmin();
  const parsed = schema.parse({
    title: formData.get("title"),
    version: formData.get("version") || undefined,
    category: formData.get("category"),
    description: formData.get("description"),
  });

  const entry = await prisma.changelogEntry.create({
    data: {
      title: parsed.title,
      version: parsed.version || null,
      category: parsed.category,
      description: parsed.description,
      createdById: admin.id,
    },
  });

  await logAudit({ actorId: admin.id, action: "changelog.create", summary: `Published changelog entry "${parsed.title}".`, targetType: "ChangelogEntry", targetId: entry.id });
  revalidateChangelogPaths();
}

export async function deleteChangelogEntry(entryId: string) {
  const admin = await requireSysAdmin();
  const entry = await prisma.changelogEntry.delete({ where: { id: entryId } });
  await logAudit({ actorId: admin.id, action: "changelog.delete", summary: `Removed changelog entry "${entry.title}".`, targetType: "ChangelogEntry", targetId: entryId });
  revalidateChangelogPaths();
}
