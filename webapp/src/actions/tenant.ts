"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomerUser } from "@/lib/session";
import { ROLES } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_USER]),
  restrictedFacilityId: z.string().optional(),
});

export async function inviteTenantUser(formData: FormData) {
  const user = await requireCustomerUser();
  if (user.role !== ROLES.CUSTOMER_ADMIN) throw new Error("Only a global admin can invite users.");

  const parsed = schema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    restrictedFacilityId: formData.get("restrictedFacilityId") || undefined,
  });

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase().trim(),
      passwordHash,
      role: parsed.role,
      enterpriseAccountId: user.enterpriseAccountId,
      restrictedFacilityId: parsed.restrictedFacilityId || null,
    },
  });

  revalidatePath("/portal/settings");
}

export async function toggleTenantUserActive(userId: string) {
  const user = await requireCustomerUser();
  if (user.role !== ROLES.CUSTOMER_ADMIN) throw new Error("Only a global admin can manage users.");
  const target = await prisma.user.findFirstOrThrow({ where: { id: userId, enterpriseAccountId: user.enterpriseAccountId } });
  await prisma.user.update({ where: { id: userId }, data: { isActive: !target.isActive } });
  revalidatePath("/portal/settings");
}
