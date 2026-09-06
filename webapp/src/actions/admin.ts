"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSysAdmin, requireMasterDataAdmin } from "@/lib/session";
import { savePublicAsset } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { CUSTOMER_ROLES, INTERNAL_ROLES, ROLES } from "@/lib/constants";

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

// --- Areas: Region -> Country -> City -> Site (Facility) -> Building -> Room
// Master data, owned by the Global Sys Admin and delegable to Service Desk —
// every action below is gated by requireMasterDataAdmin(), not requireSysAdmin().

export async function createRegion(formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  const region = await prisma.region.create({ data: { name, code } });
  await logAudit({ actorId: admin.id, action: "region.create", summary: `Created region ${name} (${code}).`, targetType: "Region", targetId: region.id });
  revalidatePath("/ops/admin/areas");
  revalidatePath("/ops/admin");
}

export async function createCountry(formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  const regionId = String(formData.get("regionId") ?? "");
  if (!name || !code || !regionId) throw new Error("Name, code and region are required.");
  const country = await prisma.country.create({ data: { name, code, regionId } });
  await logAudit({ actorId: admin.id, action: "country.create", summary: `Created country ${name} (${code}).`, targetType: "Country", targetId: country.id });
  revalidatePath("/ops/admin/areas");
  revalidatePath("/ops/admin");
}

export async function createCity(formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const countryId = String(formData.get("countryId") ?? "");
  if (!name || !countryId) throw new Error("Name and country are required.");
  const city = await prisma.city.create({ data: { name, countryId } });
  await logAudit({ actorId: admin.id, action: "city.create", summary: `Created city ${name}.`, targetType: "City", targetId: city.id });
  revalidatePath("/ops/admin/areas");
}

// --- Facilities (Sites) & buildings ------------------------------------------

const facilitySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  cityId: z.string().min(1),
  address: z.string().optional(),
  timezone: z.string().min(1),
  acsEndpointUrl: z.string().optional(),
});

export async function createFacility(formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const parsed = facilitySchema.parse({
    name: formData.get("name"),
    code: formData.get("code"),
    cityId: formData.get("cityId"),
    address: formData.get("address") || undefined,
    timezone: formData.get("timezone"),
    acsEndpointUrl: formData.get("acsEndpointUrl") || undefined,
  });

  const facility = await prisma.facility.create({
    data: {
      name: parsed.name,
      code: parsed.code.toUpperCase(),
      cityId: parsed.cityId,
      address: parsed.address || null,
      timezone: parsed.timezone,
      acsEndpointUrl: parsed.acsEndpointUrl || null,
    },
  });

  await logAudit({ actorId: admin.id, action: "facility.create", summary: `Created facility ${parsed.name}.`, targetType: "Facility", targetId: facility.id });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
  redirect(`/ops/admin/facilities/${facility.id}`);
}

export async function updateFacilityAcs(facilityId: string, formData: FormData) {
  await requireMasterDataAdmin();
  const acsEndpointUrl = String(formData.get("acsEndpointUrl") ?? "") || null;
  await prisma.facility.update({ where: { id: facilityId }, data: { acsEndpointUrl } });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

export async function createBuilding(facilityId: string, formData: FormData) {
  await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  await prisma.building.create({ data: { facilityId, name, code } });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

export async function createRoom(buildingId: string, formData: FormData) {
  await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  const room = await prisma.room.create({ data: { buildingId, name, code } });
  const building = await prisma.building.findUniqueOrThrow({ where: { id: buildingId }, select: { facilityId: true } });
  revalidatePath(`/ops/admin/facilities/${building.facilityId}`);
  return room;
}

// --- Teams --------------------------------------------------------------------
// A team is scoped to at most one geography level — a region, a country or a
// single facility — or left unscoped for a global/company-wide team.

const teamSchema = z.object({
  name: z.string().min(1),
  function: z.string().min(1),
  scopeType: z.enum(["Global", "Region", "Country", "Facility"]),
  scopeId: z.string().optional(),
});

export async function createTeam(formData: FormData) {
  const admin = await requireSysAdmin();
  const parsed = teamSchema.parse({
    name: formData.get("name"),
    function: formData.get("function"),
    scopeType: formData.get("scopeType"),
    scopeId: formData.get("scopeId") || undefined,
  });
  if (parsed.scopeType !== "Global" && !parsed.scopeId) {
    throw new Error("Choose a region, country or facility for this team's scope.");
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.name,
      function: parsed.function,
      regionId: parsed.scopeType === "Region" ? parsed.scopeId : null,
      countryId: parsed.scopeType === "Country" ? parsed.scopeId : null,
      facilityId: parsed.scopeType === "Facility" ? parsed.scopeId : null,
    },
  });

  await logAudit({ actorId: admin.id, action: "team.create", summary: `Created team ${parsed.name} (${parsed.function}).`, targetType: "Team", targetId: team.id });
  revalidatePath("/ops/admin/teams");
  revalidatePath("/ops/admin");
}

export async function deleteTeam(teamId: string) {
  const admin = await requireSysAdmin();
  const team = await prisma.team.delete({ where: { id: teamId } });
  await logAudit({ actorId: admin.id, action: "team.delete", summary: `Deleted team ${team.name}.`, targetType: "Team", targetId: teamId });
  revalidatePath("/ops/admin/teams");
  revalidatePath("/ops/admin/users");
  revalidatePath("/ops/admin");
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

// A tenant's controlled/leased area within one enrolled site — as granular as
// a Room, or as broad as a whole Building (see ControlledArea in the schema).
// The site enrollment is derived from the chosen building (a facility can
// only be enrolled once per account — see SiteEnrollment's unique constraint).
export async function createControlledArea(enterpriseAccountId: string, formData: FormData) {
  await requireSysAdmin();
  let buildingId = String(formData.get("buildingId") ?? "") || null;
  const roomId = String(formData.get("roomId") ?? "") || null;
  const label = String(formData.get("label") ?? "");
  const accessNotes = String(formData.get("accessNotes") ?? "") || null;
  if (!label || (!buildingId && !roomId)) throw new Error("A label and either a building or a room are required.");

  // A room pins the building too — the room selection wins if both are set.
  if (roomId) {
    const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId }, select: { buildingId: true } });
    buildingId = room.buildingId;
  }
  const building = await prisma.building.findUniqueOrThrow({ where: { id: buildingId! }, select: { facilityId: true } });
  const enrollment = await prisma.siteEnrollment.findUniqueOrThrow({
    where: { enterpriseAccountId_facilityId: { enterpriseAccountId, facilityId: building.facilityId } },
  });

  await prisma.controlledArea.create({ data: { siteEnrollmentId: enrollment.id, label, buildingId, roomId, accessNotes } });
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
  restrictedCountryId: z.string().optional(),
  csScope: z.string().optional(),
  teamId: z.string().optional(),
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
    restrictedCountryId: formData.get("restrictedCountryId") || undefined,
    csScope: formData.get("csScope") || undefined,
    teamId: formData.get("teamId") || undefined,
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
      restrictedCountryId: isCsTeam ? parsed.restrictedCountryId || null : null,
      csScope: isCsTeam ? parsed.csScope || "Site" : null,
      teamId: !isCustomer ? parsed.teamId || null : null,
    },
  });

  await logAudit({ actorId: admin.id, action: "user.create", summary: `Created user ${parsed.name} (${parsed.role}).`, targetType: "User", targetId: user.id });
  revalidatePath("/ops/admin/users");
  revalidatePath("/ops/admin/teams");
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
    restrictedCountryId: formData.get("restrictedCountryId") || undefined,
    csScope: formData.get("csScope") || undefined,
    teamId: formData.get("teamId") || undefined,
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
      restrictedCountryId: isCsTeam ? parsed.restrictedCountryId || null : null,
      csScope: isCsTeam ? parsed.csScope || "Site" : null,
      teamId: !isCustomer ? parsed.teamId || null : null,
    },
  });

  await logAudit({ actorId: admin.id, action: "user.update", summary: `Updated user ${parsed.name} (${parsed.role}).`, targetType: "User", targetId: userId });
  revalidatePath("/ops/admin/users");
  revalidatePath("/ops/admin/teams");
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
