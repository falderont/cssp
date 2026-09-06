"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireInternalUser } from "@/lib/session";
import { ROLES } from "@/lib/constants";

async function requireSecurityOrAdmin() {
  const user = await requireInternalUser();
  const allowed: string[] = [ROLES.SYS_ADMIN, ROLES.OPS_FRONT_OFFICE_SECURITY, ROLES.OPS_SITE_MANAGER];
  if (!allowed.includes(user.role)) throw new Error("You do not have permission to manage the blacklist.");
  return user;
}

export async function createBlacklistEntry(formData: FormData) {
  const user = await requireSecurityOrAdmin();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const idNumber = String(formData.get("idNumber") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!fullName || !reason) throw new Error("Name and reason are required.");

  await prisma.blacklistEntry.create({
    data: { fullName, idNumber: idNumber || null, company: company || null, reason, createdById: user.id },
  });

  revalidatePath("/ops/admin/blacklist");
}

export async function deleteBlacklistEntry(id: string) {
  await requireSecurityOrAdmin();
  await prisma.blacklistEntry.delete({ where: { id } });
  revalidatePath("/ops/admin/blacklist");
}
