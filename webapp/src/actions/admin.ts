"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSysAdmin } from "@/lib/session";
import { savePublicAsset } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { CUSTOMER_ROLES, INTERNAL_ROLES, ROLES, ROOM_TYPES } from "@/lib/constants";

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
  const admin = await requireSysAdmin();
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

  await logAudit({ actorId: admin.id, action: "branding.update", summary: `Updated provider branding (${parsed.companyName}).` });
  revalidatePath("/", "layout");
}

// --- Regions ----------------------------------------------------------------

export async function createRegion(formData: FormData) {
  const admin = await requireSysAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  const region = await prisma.region.create({ data: { name, code } });
  await logAudit({ actorId: admin.id, action: "region.create", summary: `Created region ${name} (${code}).`, targetType: "Region", targetId: region.id });
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
  const admin = await requireSysAdmin();
  const parsed = facilitySchema.parse({
    name: formData.get("name"),
    code: formData.get("code"),
    regionId: formData.get("regionId"),
    address: formData.get("address") || undefined,
    timezone: formData.get("timezone"),
    acsEndpointUrl: formData.get("acsEndpointUrl") || undefined,
  });
  const offersColoRacks = formData.get("offersColoRacks") === "on";

  const facility = await prisma.facility.create({
    data: {
      name: parsed.name,
      code: parsed.code.toUpperCase(),
      regionId: parsed.regionId,
      address: parsed.address || null,
      timezone: parsed.timezone,
      acsEndpointUrl: parsed.acsEndpointUrl || null,
      offersColoRacks,
    },
  });

  await logAudit({ actorId: admin.id, action: "facility.create", summary: `Created facility ${parsed.name}.`, targetType: "Facility", targetId: facility.id });
  revalidatePath("/ops/admin/facilities");
  redirect(`/ops/admin/facilities/${facility.id}`);
}

export async function updateFacilityAcs(facilityId: string, formData: FormData) {
  await requireSysAdmin();
  const acsEndpointUrl = String(formData.get("acsEndpointUrl") ?? "") || null;
  await prisma.facility.update({ where: { id: facilityId }, data: { acsEndpointUrl } });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

export async function createBuilding(facilityId: string, formData: FormData) {
  await requireSysAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  await prisma.building.create({ data: { facilityId, name, code } });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

// --- Facility space model: rooms (data halls/offices/storage) & racks -------

export async function updateFacilitySpaceModel(facilityId: string, formData: FormData) {
  const admin = await requireSysAdmin();
  const offersColoRacks = formData.get("offersColoRacks") === "on";
  await prisma.facility.update({ where: { id: facilityId }, data: { offersColoRacks } });
  await logAudit({
    actorId: admin.id,
    action: "facility.update_space_model",
    summary: `Set facility space model to ${offersColoRacks ? "rooms with colo racks" : "rooms only"}.`,
    targetType: "Facility",
    targetId: facilityId,
  });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

export async function createRoom(facilityId: string, formData: FormData) {
  await requireSysAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  const type = String(formData.get("type") ?? "DataHall");
  const buildingId = String(formData.get("buildingId") ?? "") || null;
  if (!name || !code) throw new Error("Name and code are required.");
  if (!(ROOM_TYPES as readonly string[]).includes(type)) throw new Error("Invalid room type.");
  await prisma.room.create({ data: { facilityId, buildingId, name, code, type } });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

export async function createRack(facilityId: string, roomId: string, formData: FormData) {
  await requireSysAdmin();
  const rackNumber = String(formData.get("rackNumber") ?? "").trim();
  if (!rackNumber) throw new Error("Rack number is required.");

  const [facility, room] = await Promise.all([
    prisma.facility.findUniqueOrThrow({ where: { id: facilityId } }),
    prisma.room.findUniqueOrThrow({ where: { id: roomId } }),
  ]);
  if (room.facilityId !== facilityId) throw new Error("Room does not belong to this facility.");
  if (!facility.offersColoRacks) throw new Error("This facility is configured for rooms only — enable colo racks first.");

  await prisma.rack.create({ data: { roomId, rackNumber } });
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
  const admin = await requireSysAdmin();
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

  await logAudit({ actorId: admin.id, action: "tenant.create", summary: `Created tenant account ${parsed.name}.`, targetType: "EnterpriseAccount", targetId: account.id });
  revalidatePath("/ops/admin/accounts");
  redirect(`/ops/admin/accounts/${account.id}`);
}

export async function createSiteEnrollment(enterpriseAccountId: string, formData: FormData) {
  await requireSysAdmin();
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
  restrictedRegionId: z.string().optional(),
  csScope: z.string().optional(),
});

export async function createUser(formData: FormData) {
  const admin = await requireSysAdmin();
  const parsed = userSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    enterpriseAccountId: formData.get("enterpriseAccountId") || undefined,
    restrictedFacilityId: formData.get("restrictedFacilityId") || undefined,
    restrictedRegionId: formData.get("restrictedRegionId") || undefined,
    csScope: formData.get("csScope") || undefined,
  });

  const isCustomer = (CUSTOMER_ROLES as string[]).includes(parsed.role);
  if (isCustomer && !parsed.enterpriseAccountId) {
    throw new Error("Tenant users must belong to an enterprise account.");
  }
  const isCsTeam = parsed.role === ROLES.CS_TEAM;

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase().trim(),
      passwordHash,
      role: parsed.role,
      enterpriseAccountId: isCustomer ? parsed.enterpriseAccountId! : null,
      restrictedFacilityId: parsed.restrictedFacilityId || null,
      restrictedRegionId: isCsTeam ? parsed.restrictedRegionId || null : null,
      csScope: isCsTeam ? parsed.csScope || "Site" : null,
    },
  });

  await logAudit({ actorId: admin.id, action: "user.create", summary: `Created user ${parsed.name} (${parsed.role}).`, targetType: "User", targetId: user.id });
  revalidatePath("/ops/admin/users");
  redirect("/ops/admin/users");
}

const updateUserSchema = userSchema.omit({ password: true });

export async function updateUser(userId: string, formData: FormData) {
  const admin = await requireSysAdmin();
  const parsed = updateUserSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    enterpriseAccountId: formData.get("enterpriseAccountId") || undefined,
    restrictedFacilityId: formData.get("restrictedFacilityId") || undefined,
    restrictedRegionId: formData.get("restrictedRegionId") || undefined,
    csScope: formData.get("csScope") || undefined,
  });

  const isCustomer = (CUSTOMER_ROLES as string[]).includes(parsed.role);
  if (isCustomer && !parsed.enterpriseAccountId) {
    throw new Error("Tenant users must belong to an enterprise account.");
  }
  const isCsTeam = parsed.role === ROLES.CS_TEAM;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase().trim(),
      role: parsed.role,
      enterpriseAccountId: isCustomer ? parsed.enterpriseAccountId! : null,
      restrictedFacilityId: parsed.restrictedFacilityId || null,
      restrictedRegionId: isCsTeam ? parsed.restrictedRegionId || null : null,
      csScope: isCsTeam ? parsed.csScope || "Site" : null,
    },
  });

  await logAudit({ actorId: admin.id, action: "user.update", summary: `Updated user ${parsed.name} (${parsed.role}).`, targetType: "User", targetId: userId });
  revalidatePath("/ops/admin/users");
  redirect("/ops/admin/users");
}

export async function resetUserPassword(userId: string, formData: FormData) {
  const admin = await requireSysAdmin();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const passwordHash = await bcrypt.hash(password, 10);
  const target = await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await logAudit({ actorId: admin.id, action: "user.reset_password", summary: `Reset password for ${target.name}.`, targetType: "User", targetId: userId });
  revalidatePath(`/ops/admin/users/${userId}`);
}

export async function toggleUserActive(userId: string, returnPath: string) {
  const admin = await requireSysAdmin();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  await logAudit({
    actorId: admin.id,
    action: "user.toggle_active",
    summary: `${user.isActive ? "Disabled" : "Enabled"} user ${user.name}.`,
    targetType: "User",
    targetId: userId,
  });
  revalidatePath(returnPath);
}
