"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser } from "@/lib/session";
import { savePublicAsset } from "@/lib/storage";
import { withUniqueConstraintMessage } from "@/lib/prisma-errors";
import { ROLES, TENANT_ROLES } from "@/lib/constants";

async function requireTenantGlobalAdminAction() {
  const user = await requireCustomerUser();
  if (user.role !== ROLES.TENANT_GLOBAL_ADMIN) throw new Error("Only a Global Admin can manage users.");
  return user;
}

const inviteSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(TENANT_ROLES as [string, ...string[]]),
  restrictedFacilityId: z.string().optional(),
});

export async function inviteTenantUser(formData: FormData) {
  const user = await requireTenantGlobalAdminAction();

  const parsed = inviteSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    restrictedFacilityId: formData.get("restrictedFacilityId") || undefined,
  });

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  await withUniqueConstraintMessage(
    () =>
      prisma.user.create({
        data: {
          name: parsed.name,
          email: parsed.email.toLowerCase().trim(),
          passwordHash,
          role: parsed.role,
          enterpriseAccountId: user.enterpriseAccountId,
          restrictedFacilityId: parsed.restrictedFacilityId || null,
        },
      }),
    `A user with email "${parsed.email.toLowerCase().trim()}" already exists.`
  );

  revalidatePath("/portal/settings");
}

export async function toggleTenantUserActive(userId: string) {
  const user = await requireTenantGlobalAdminAction();
  const target = await prisma.user.findFirstOrThrow({ where: { id: userId, enterpriseAccountId: user.enterpriseAccountId } });
  await prisma.user.update({ where: { id: userId }, data: { isActive: !target.isActive } });
  revalidatePath("/portal/settings");
}

const updateRoleSchema = z.object({
  role: z.enum(TENANT_ROLES as [string, ...string[]]),
  restrictedFacilityId: z.string().optional(),
});

export async function updateTenantUserRole(userId: string, formData: FormData) {
  const user = await requireTenantGlobalAdminAction();
  const parsed = updateRoleSchema.parse({
    role: formData.get("role"),
    restrictedFacilityId: formData.get("restrictedFacilityId") || undefined,
  });
  await prisma.user.findFirstOrThrow({ where: { id: userId, enterpriseAccountId: user.enterpriseAccountId } });
  await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.role, restrictedFacilityId: parsed.restrictedFacilityId || null },
  });
  revalidatePath("/portal/settings");
}

export async function resetTenantUserPassword(userId: string, formData: FormData) {
  const user = await requireTenantGlobalAdminAction();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  await prisma.user.findFirstOrThrow({ where: { id: userId, enterpriseAccountId: user.enterpriseAccountId } });
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath("/portal/settings");
}

const brandingSchema = z.object({
  primaryColor: z.string().optional(),
});

export async function updateTenantBranding(formData: FormData) {
  const user = await requireTenantGlobalAdminAction();
  const parsed = brandingSchema.parse({ primaryColor: formData.get("primaryColor") || undefined });

  const logoFile = formData.get("logo");
  let logoUrl: string | undefined;
  if (logoFile instanceof File && logoFile.size > 0) {
    logoUrl = await savePublicAsset(logoFile, "tenant-branding");
  }

  await prisma.enterpriseAccount.update({
    where: { id: user.enterpriseAccountId },
    data: { primaryColor: parsed.primaryColor || null, ...(logoUrl ? { logoUrl } : {}) },
  });

  revalidatePath("/", "layout");
}
