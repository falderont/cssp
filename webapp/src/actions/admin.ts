"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { savePublicAsset } from "@/lib/storage";
import { CUSTOMER_ROLES, INTERNAL_ROLES } from "@/lib/constants";

// --- Branding -------------------------------------------------------------

const brandingSchema = z.object({
  companyName: z.string().min(1),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(1),
  address: z.string().optional(),
});

export async function updateBranding(formData: FormData) {
  await requireSuperAdmin();
  const parsed = brandingSchema.parse({
    companyName: formData.get("companyName"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    supportEmail: formData.get("supportEmail"),
    supportPhone: formData.get("supportPhone"),
    address: formData.get("address") || undefined,
  });

  const logoFile = formData.get("logo");
  let logoUrl: string | undefined;
  if (logoFile instanceof File && logoFile.size > 0) {
    logoUrl = await savePublicAsset(logoFile, "branding");
  }

  await prisma.providerSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed, address: parsed.address || null, ...(logoUrl ? { logoUrl } : {}) },
    update: { ...parsed, address: parsed.address || null, ...(logoUrl ? { logoUrl } : {}) },
  });

  revalidatePath("/", "layout");
}

// --- Regions ----------------------------------------------------------------

export async function createRegion(formData: FormData) {
  await requireSuperAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  await prisma.region.create({ data: { name, code } });
  revalidatePath("/ops/admin/regions");
}

// --- Facilities & buildings --------------------------------------------------

const facilitySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  regionId: z.string().min(1),
  address: z.string().optional(),
  timezone: z.string().min(1),
  acsEndpointUrl: z.string().optional(),
});

export async function createFacility(formData: FormData) {
  await requireSuperAdmin();
  const parsed = facilitySchema.parse({
    name: formData.get("name"),
    code: formData.get("code"),
    regionId: formData.get("regionId"),
    address: formData.get("address") || undefined,
    timezone: formData.get("timezone"),
    acsEndpointUrl: formData.get("acsEndpointUrl") || undefined,
  });

  const facility = await prisma.facility.create({
    data: {
      name: parsed.name,
      code: parsed.code.toUpperCase(),
      regionId: parsed.regionId,
      address: parsed.address || null,
      timezone: parsed.timezone,
      acsEndpointUrl: parsed.acsEndpointUrl || null,
    },
  });

  revalidatePath("/ops/admin/facilities");
  redirect(`/ops/admin/facilities/${facility.id}`);
}

export async function updateFacilityAcs(facilityId: string, formData: FormData) {
  await requireSuperAdmin();
  const acsEndpointUrl = String(formData.get("acsEndpointUrl") ?? "") || null;
  await prisma.facility.update({ where: { id: facilityId }, data: { acsEndpointUrl } });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

export async function createBuilding(facilityId: string, formData: FormData) {
  await requireSuperAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  await prisma.building.create({ data: { facilityId, name, code } });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

// --- Enterprise accounts & site enrollments ----------------------------------

const accountSchema = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  tier: z.string().min(1),
  billingEmail: z.string().email().optional().or(z.literal("")),
});

export async function createEnterpriseAccount(formData: FormData) {
  await requireSuperAdmin();
  const parsed = accountSchema.parse({
    name: formData.get("name"),
    legalName: formData.get("legalName") || undefined,
    tier: formData.get("tier"),
    billingEmail: formData.get("billingEmail") || "",
  });

  const account = await prisma.enterpriseAccount.create({
    data: {
      name: parsed.name,
      legalName: parsed.legalName || null,
      tier: parsed.tier,
      billingEmail: parsed.billingEmail || null,
    },
  });

  revalidatePath("/ops/admin/accounts");
  redirect(`/ops/admin/accounts/${account.id}`);
}

export async function createSiteEnrollment(enterpriseAccountId: string, formData: FormData) {
  await requireSuperAdmin();
  const facilityId = String(formData.get("facilityId") ?? "");
  const spaceRef = String(formData.get("spaceRef") ?? "") || null;
  if (!facilityId) throw new Error("Choose a facility.");
  await prisma.siteEnrollment.create({ data: { enterpriseAccountId, facilityId, spaceRef } });
  revalidatePath(`/ops/admin/accounts/${enterpriseAccountId}`);
}

// --- Users -------------------------------------------------------------------

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum([...INTERNAL_ROLES, ...CUSTOMER_ROLES] as [string, ...string[]]),
  enterpriseAccountId: z.string().optional(),
  restrictedFacilityId: z.string().optional(),
});

export async function createUser(formData: FormData) {
  await requireSuperAdmin();
  const parsed = userSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    enterpriseAccountId: formData.get("enterpriseAccountId") || undefined,
    restrictedFacilityId: formData.get("restrictedFacilityId") || undefined,
  });

  const isCustomer = (CUSTOMER_ROLES as string[]).includes(parsed.role);
  if (isCustomer && !parsed.enterpriseAccountId) {
    throw new Error("Tenant users must belong to an enterprise account.");
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase().trim(),
      passwordHash,
      role: parsed.role,
      enterpriseAccountId: isCustomer ? parsed.enterpriseAccountId! : null,
      restrictedFacilityId: isCustomer ? parsed.restrictedFacilityId || null : null,
    },
  });

  revalidatePath("/ops/admin/users");
  redirect("/ops/admin/users");
}

export async function toggleUserActive(userId: string, returnPath: string) {
  await requireSuperAdmin();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  revalidatePath(returnPath);
}
