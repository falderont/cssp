"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSysAdmin, requireMasterDataAdmin, requireAccountManager } from "@/lib/session";
import { savePublicAsset } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { withUniqueConstraintMessage, withForeignKeyConstraintMessage, assertNoDependents } from "@/lib/prisma-errors";
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

// --- Areas: Region -> Country -> City -> Site (Facility) -> Building -> Room
// Master data, owned by the Global Sys Admin and delegable to Service Desk —
// every action below is gated by requireMasterDataAdmin(), not requireSysAdmin().
// Region/Country/City/Site are staged on one consolidated screen
// (/ops/admin/facilities — see facility-hierarchy-explorer.tsx): each level
// is added inline as you drill in, so onboarding a site in a country/city
// the platform hasn't seen yet is just adding each level in turn, without
// leaving the page. Building/Room management then hands off to that site's
// own dedicated admin page.

export async function createRegion(formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  const region = await withUniqueConstraintMessage(
    () => prisma.region.create({ data: { name, code } }),
    `A region with code "${code}" already exists — choose a different code.`
  );
  await logAudit({ actorId: admin.id, action: "region.create", summary: `Created region ${name} (${code}).`, targetType: "Region", targetId: region.id });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
}

// Regions are near-static reference data — provider-wide geography rarely
// changes — so rather than a full edit/delete flow, a region is just toggled
// active/inactive. Inactive regions stay visible here (with their existing
// countries/cities/sites) but are meant to be excluded from places that let
// staff pick a region going forward (team coverage, CS scope, etc.).
export async function toggleRegionActive(regionId: string) {
  const admin = await requireMasterDataAdmin();
  const region = await prisma.region.findUniqueOrThrow({ where: { id: regionId } });
  const isActive = !region.isActive;
  await prisma.region.update({ where: { id: regionId }, data: { isActive } });
  await logAudit({
    actorId: admin.id,
    action: "region.toggle_active",
    summary: `Marked region ${region.name} ${isActive ? "active" : "inactive"}.`,
    targetType: "Region",
    targetId: regionId,
  });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
}

// Fixing a typo or renaming a region is still just correcting existing
// dummy/reference data, distinct from the "add regions on a whim" flow the
// toggle above replaced — kept as a full edit, gated the same as creation.
export async function updateRegion(regionId: string, formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  await withUniqueConstraintMessage(
    () => prisma.region.update({ where: { id: regionId }, data: { name, code } }),
    `A region with code "${code}" already exists — choose a different code.`
  );
  await logAudit({ actorId: admin.id, action: "region.update", summary: `Updated region ${name} (${code}).`, targetType: "Region", targetId: regionId });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
}

export async function createCountry(regionId: string, formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  const country = await withUniqueConstraintMessage(
    () => prisma.country.create({ data: { name, code, regionId } }),
    `A country with code "${code}" already exists — choose a different code.`
  );
  await logAudit({ actorId: admin.id, action: "country.create", summary: `Created country ${name} (${code}).`, targetType: "Country", targetId: country.id });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
}

export async function updateCountry(countryId: string, formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  await withUniqueConstraintMessage(
    () => prisma.country.update({ where: { id: countryId }, data: { name, code } }),
    `A country with code "${code}" already exists — choose a different code.`
  );
  await logAudit({ actorId: admin.id, action: "country.update", summary: `Updated country ${name} (${code}).`, targetType: "Country", targetId: countryId });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
}

export async function deleteCountry(countryId: string) {
  const admin = await requireMasterDataAdmin();
  const country = await prisma.country.findUniqueOrThrow({ where: { id: countryId } });
  await assertNoDependents("country", [
    prisma.city.count({ where: { countryId } }).then((count) => ({ label: `cit${count === 1 ? "y" : "ies"}`, count })),
    prisma.user.count({ where: { restrictedCountryId: countryId } }).then((count) => ({ label: `user(s) restricted to it`, count })),
    prisma.team.count({ where: { countryId } }).then((count) => ({ label: `team(s) scoped to it`, count })),
  ]);
  await withForeignKeyConstraintMessage(
    () => prisma.country.delete({ where: { id: countryId } }),
    "Can't delete this country — it still has related records. Remove those first."
  );
  await logAudit({ actorId: admin.id, action: "country.delete", summary: `Deleted country ${country.name} (${country.code}).`, targetType: "Country", targetId: countryId });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
}

export async function createCity(countryId: string, formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  if (!name) throw new Error("Name is required.");
  const city = await withUniqueConstraintMessage(
    () => prisma.city.create({ data: { name, countryId } }),
    `A city named "${name}" already exists in this country.`
  );
  await logAudit({ actorId: admin.id, action: "city.create", summary: `Created city ${name}.`, targetType: "City", targetId: city.id });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
}

export async function updateCity(cityId: string, formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  if (!name) throw new Error("Name is required.");
  await withUniqueConstraintMessage(
    () => prisma.city.update({ where: { id: cityId }, data: { name } }),
    `A city named "${name}" already exists in this country.`
  );
  await logAudit({ actorId: admin.id, action: "city.update", summary: `Updated city ${name}.`, targetType: "City", targetId: cityId });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
}

export async function deleteCity(cityId: string) {
  const admin = await requireMasterDataAdmin();
  const city = await prisma.city.findUniqueOrThrow({ where: { id: cityId } });
  await assertNoDependents("city", [
    prisma.facility.count({ where: { cityId } }).then((count) => ({ label: `site${count === 1 ? "" : "s"}`, count })),
  ]);
  await withForeignKeyConstraintMessage(
    () => prisma.city.delete({ where: { id: cityId } }),
    "Can't delete this city — it still has related records. Remove those first."
  );
  await logAudit({ actorId: admin.id, action: "city.delete", summary: `Deleted city ${city.name}.`, targetType: "City", targetId: cityId });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
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

export async function createFacility(cityId: string, formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const parsed = facilitySchema.parse({
    name: formData.get("name"),
    code: formData.get("code"),
    cityId,
    address: formData.get("address") || undefined,
    timezone: formData.get("timezone"),
    acsEndpointUrl: formData.get("acsEndpointUrl") || undefined,
  });

  const facility = await withUniqueConstraintMessage(
    () =>
      prisma.facility.create({
        data: {
          name: parsed.name,
          code: parsed.code.toUpperCase(),
          cityId: parsed.cityId,
          address: parsed.address || null,
          timezone: parsed.timezone,
          acsEndpointUrl: parsed.acsEndpointUrl || null,
        },
      }),
    `A site with code "${parsed.code.toUpperCase()}" already exists — site codes must be unique across the whole platform.`
  );

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

// Renaming a site is Global Sys Admin only — unlike the rest of Area master
// data (delegable to Service Desk via requireMasterDataAdmin()), the site
// name is referenced across tenant-facing branding, invoices and reports, so
// changing it is kept to the one role with full platform control.
export async function updateFacilityDetails(facilityId: string, formData: FormData) {
  const admin = await requireSysAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name || !code || !timezone) throw new Error("Site name, code and timezone are required.");
  const facility = await withUniqueConstraintMessage(
    () =>
      prisma.facility.update({
        where: { id: facilityId },
        data: { name, code, timezone, address: address || null },
      }),
    `A site with code "${code}" already exists — site codes must be unique across the whole platform.`
  );
  await logAudit({
    actorId: admin.id,
    action: "facility.update",
    summary: `Updated site details for ${facility.name}.`,
    targetType: "Facility",
    targetId: facilityId,
  });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
  revalidatePath("/ops/admin/facilities");
}

// Whether this site offers numbered colo racks (add rack numbers under Data
// Hall rooms) or leases whole rooms only (data halls, offices, storage) with
// no rack-level breakdown — see Room.type and the Rack model.
export async function updateFacilitySpaceModel(facilityId: string, formData: FormData) {
  const admin = await requireMasterDataAdmin();
  const offersColoRacks = formData.get("offersColoRacks") === "on";
  await prisma.facility.update({ where: { id: facilityId }, data: { offersColoRacks } });
  await logAudit({
    actorId: admin.id,
    action: "facility.update_space_model",
    summary: `Set site space model to ${offersColoRacks ? "rooms with colo racks" : "rooms only"}.`,
    targetType: "Facility",
    targetId: facilityId,
  });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

export async function deleteFacility(facilityId: string) {
  const admin = await requireMasterDataAdmin();
  const facility = await prisma.facility.findUniqueOrThrow({ where: { id: facilityId } });
  await assertNoDependents("site", [
    prisma.building.count({ where: { facilityId } }).then((count) => ({ label: `building${count === 1 ? "" : "s"}`, count })),
    prisma.siteEnrollment.count({ where: { facilityId } }).then((count) => ({ label: `tenant enrollment(s)`, count })),
    prisma.incident.count({ where: { facilityId } }).then((count) => ({ label: `incident(s)`, count })),
    prisma.maintenanceEvent.count({ where: { facilityId } }).then((count) => ({ label: `maintenance event(s)`, count })),
    prisma.telemetrySource.count({ where: { facilityId } }).then((count) => ({ label: `telemetry integration(s)`, count })),
    prisma.telemetryPoint.count({ where: { facilityId } }).then((count) => ({ label: `telemetry reading(s)`, count })),
    prisma.document.count({ where: { facilityId } }).then((count) => ({ label: `document(s)`, count })),
    prisma.delivery.count({ where: { facilityId } }).then((count) => ({ label: `deliver${count === 1 ? "y" : "ies"}`, count })),
    prisma.loadingDock.count({ where: { facilityId } }).then((count) => ({ label: `loading dock${count === 1 ? "" : "s"}`, count })),
    prisma.user.count({ where: { restrictedFacilityId: facilityId } }).then((count) => ({ label: `user(s) restricted to it`, count })),
    prisma.authorizedAccessEntry
      .count({ where: { facilityId } })
      .then((count) => ({ label: `authorized access entr${count === 1 ? "y" : "ies"}`, count })),
    prisma.team.count({ where: { facilityId } }).then((count) => ({ label: `team(s) scoped to it`, count })),
  ]);
  await withForeignKeyConstraintMessage(
    () => prisma.facility.delete({ where: { id: facilityId } }),
    "Can't delete this site — it still has related records. Remove those first."
  );
  await logAudit({ actorId: admin.id, action: "facility.delete", summary: `Deleted site ${facility.name} (${facility.code}).`, targetType: "Facility", targetId: facilityId });
  revalidatePath("/ops/admin/facilities");
  revalidatePath("/ops/admin");
  redirect("/ops/admin/facilities");
}

export async function createBuilding(facilityId: string, formData: FormData) {
  await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  await withUniqueConstraintMessage(
    () => prisma.building.create({ data: { facilityId, name, code } }),
    `A building with code "${code}" already exists at this site.`
  );
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

export async function updateBuilding(buildingId: string, formData: FormData) {
  await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  if (!name || !code) throw new Error("Name and code are required.");
  const building = await withUniqueConstraintMessage(
    () => prisma.building.update({ where: { id: buildingId }, data: { name, code } }),
    `A building with code "${code}" already exists at this site.`
  );
  revalidatePath(`/ops/admin/facilities/${building.facilityId}`);
}

export async function deleteBuilding(buildingId: string) {
  await requireMasterDataAdmin();
  const building = await prisma.building.findUniqueOrThrow({ where: { id: buildingId } });
  await assertNoDependents("building", [
    prisma.room.count({ where: { buildingId } }).then((count) => ({ label: `room${count === 1 ? "" : "s"}`, count })),
    prisma.incident.count({ where: { buildingId } }).then((count) => ({ label: `incident(s)`, count })),
    prisma.maintenanceEvent.count({ where: { buildingId } }).then((count) => ({ label: `maintenance event(s)`, count })),
    prisma.telemetryPoint.count({ where: { buildingId } }).then((count) => ({ label: `telemetry reading(s)`, count })),
    prisma.visitorRequest.count({ where: { buildingId } }).then((count) => ({ label: `visitor request(s)`, count })),
    prisma.controlledArea.count({ where: { buildingId } }).then((count) => ({ label: `tenant controlled area(s)`, count })),
    prisma.loadingDock.count({ where: { buildingId } }).then((count) => ({ label: `loading dock${count === 1 ? "" : "s"}`, count })),
  ]);
  await withForeignKeyConstraintMessage(
    () => prisma.building.delete({ where: { id: buildingId } }),
    "Can't delete this building — it still has related records. Remove those first."
  );
  revalidatePath(`/ops/admin/facilities/${building.facilityId}`);
}

export async function createRoom(buildingId: string, formData: FormData) {
  await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  const type = String(formData.get("type") ?? "DataHall");
  if (!name || !code) throw new Error("Name and code are required.");
  if (!(ROOM_TYPES as readonly string[]).includes(type)) throw new Error("Invalid room type.");
  const room = await withUniqueConstraintMessage(
    () => prisma.room.create({ data: { buildingId, name, code, type } }),
    `A room with code "${code}" already exists in this building.`
  );
  const building = await prisma.building.findUniqueOrThrow({ where: { id: buildingId }, select: { facilityId: true } });
  revalidatePath(`/ops/admin/facilities/${building.facilityId}`);
  return room;
}

export async function updateRoom(roomId: string, formData: FormData) {
  await requireMasterDataAdmin();
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  const type = String(formData.get("type") ?? "DataHall");
  if (!name || !code) throw new Error("Name and code are required.");
  if (!(ROOM_TYPES as readonly string[]).includes(type)) throw new Error("Invalid room type.");
  const room = await withUniqueConstraintMessage(
    () =>
      prisma.room.update({
        where: { id: roomId },
        data: { name, code, type },
        include: { building: true },
      }),
    `A room with code "${code}" already exists in this building.`
  );
  revalidatePath(`/ops/admin/facilities/${room.building.facilityId}`);
}

export async function deleteRoom(roomId: string) {
  await requireMasterDataAdmin();
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: { building: true } });
  await assertNoDependents("room", [
    prisma.rack.count({ where: { roomId } }).then((count) => ({ label: `rack${count === 1 ? "" : "s"}`, count })),
    prisma.controlledArea.count({ where: { roomId } }).then((count) => ({ label: `tenant controlled area(s)`, count })),
  ]);
  await withForeignKeyConstraintMessage(
    () => prisma.room.delete({ where: { id: roomId } }),
    "Can't delete this room — it still has related records. Remove those first."
  );
  revalidatePath(`/ops/admin/facilities/${room.building.facilityId}`);
}

export async function createRack(facilityId: string, roomId: string, formData: FormData) {
  await requireMasterDataAdmin();
  const rackNumber = String(formData.get("rackNumber") ?? "").trim();
  if (!rackNumber) throw new Error("Rack number is required.");

  const [facility, room] = await Promise.all([
    prisma.facility.findUniqueOrThrow({ where: { id: facilityId } }),
    prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: { building: true } }),
  ]);
  if (room.building.facilityId !== facilityId) throw new Error("Room does not belong to this site.");
  if (!facility.offersColoRacks) throw new Error("This site is configured for rooms only — enable colo racks first.");

  await withUniqueConstraintMessage(
    () => prisma.rack.create({ data: { roomId, rackNumber } }),
    `Rack "${rackNumber}" already exists in this room.`
  );
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

export async function updateRack(facilityId: string, rackId: string, formData: FormData) {
  await requireMasterDataAdmin();
  const rackNumber = String(formData.get("rackNumber") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!rackNumber) throw new Error("Rack number is required.");
  await withUniqueConstraintMessage(
    () => prisma.rack.update({ where: { id: rackId }, data: { rackNumber, notes: notes || null } }),
    `Rack "${rackNumber}" already exists in this room.`
  );
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
}

export async function deleteRack(facilityId: string, rackId: string) {
  await requireMasterDataAdmin();
  await prisma.rack.delete({ where: { id: rackId } });
  revalidatePath(`/ops/admin/facilities/${facilityId}`);
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

export async function updateTeam(teamId: string, formData: FormData) {
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

  await prisma.team.update({
    where: { id: teamId },
    data: {
      name: parsed.name,
      function: parsed.function,
      regionId: parsed.scopeType === "Region" ? parsed.scopeId : null,
      countryId: parsed.scopeType === "Country" ? parsed.scopeId : null,
      facilityId: parsed.scopeType === "Facility" ? parsed.scopeId : null,
    },
  });

  await logAudit({ actorId: admin.id, action: "team.update", summary: `Updated team ${parsed.name} (${parsed.function}).`, targetType: "Team", targetId: teamId });
  revalidatePath("/ops/admin/teams");
  revalidatePath("/ops/admin");
}

export async function deleteTeam(teamId: string) {
  const admin = await requireSysAdmin();
  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  await assertNoDependents("team", [
    prisma.user.count({ where: { teamId } }).then((count) => ({ label: `member(s)`, count })),
  ]);
  await withForeignKeyConstraintMessage(
    () => prisma.team.delete({ where: { id: teamId } }),
    "Can't delete this team — it still has members. Remove those first."
  );
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

const accountUpdateSchema = accountSchema.extend({
  status: z.enum(["Active", "Suspended"]),
});

export async function updateEnterpriseAccount(accountId: string, formData: FormData) {
  const admin = await requireSysAdmin();
  const parsed = accountUpdateSchema.parse({
    name: formData.get("name"),
    legalName: formData.get("legalName") || undefined,
    tier: formData.get("tier"),
    billingEmail: formData.get("billingEmail") || "",
    status: formData.get("status"),
  });

  const account = await prisma.enterpriseAccount.update({
    where: { id: accountId },
    data: {
      name: parsed.name,
      legalName: parsed.legalName || null,
      tier: parsed.tier,
      billingEmail: parsed.billingEmail || null,
      status: parsed.status,
    },
  });

  await logAudit({ actorId: admin.id, action: "tenant.update", summary: `Updated tenant account ${account.name}.`, targetType: "EnterpriseAccount", targetId: accountId });
  revalidatePath(`/ops/admin/accounts/${accountId}`);
  revalidatePath("/ops/admin/accounts");
}

export async function createSiteEnrollment(enterpriseAccountId: string, formData: FormData) {
  await requireSysAdmin();
  const facilityId = String(formData.get("facilityId") ?? "");
  const spaceRef = String(formData.get("spaceRef") ?? "") || null;
  if (!facilityId) throw new Error("Choose a facility.");
  await withUniqueConstraintMessage(
    () => prisma.siteEnrollment.create({ data: { enterpriseAccountId, facilityId, spaceRef } }),
    "This tenant is already enrolled at that facility."
  );
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

// Offboarding step: end (or reinstate) one tenant's enrollment at one
// facility, independent of the account's other sites and independent of
// updateEnterpriseAccount's account-wide status above. Kept as a status flag
// rather than a delete — historical visitor/service-request/billing records
// stay attached to the enrollment for the audit trail.
const siteEnrollmentStatusSchema = z.enum(["Active", "Suspended"]);

export async function updateSiteEnrollmentStatus(enrollmentId: string, formData: FormData) {
  const admin = await requireSysAdmin();
  const status = siteEnrollmentStatusSchema.parse(formData.get("status"));
  const enrollment = await prisma.siteEnrollment.update({
    where: { id: enrollmentId },
    data: { status },
    include: { enterpriseAccount: true, facility: true },
  });
  await logAudit({
    actorId: admin.id,
    action: "site_enrollment.update_status",
    summary: `Set ${enrollment.enterpriseAccount.name}'s enrollment at ${enrollment.facility.name} to ${status}.`,
    targetType: "SiteEnrollment",
    targetId: enrollmentId,
  });
  revalidatePath(`/ops/admin/accounts/${enrollment.enterpriseAccountId}`);
  revalidatePath(`/ops/admin/facilities/${enrollment.facilityId}`);
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
  const user = await withUniqueConstraintMessage(
    () =>
      prisma.user.create({
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
      }),
    `A user with email "${parsed.email.toLowerCase().trim()}" already exists.`
  );

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

  await withUniqueConstraintMessage(
    () =>
      prisma.user.update({
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
      }),
    `A user with email "${parsed.email.toLowerCase().trim()}" already exists.`
  );

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

// --- Tenant account user management (delegable to Service Desk) -------------
// Scoped strictly to one EnterpriseAccount's own users — see
// requireAccountManager() in lib/session.ts. Distinct from createUser/
// updateUser/toggleUserActive/resetUserPassword above, which stay Global Sys
// Admin-only and cover every persona (internal staff included); these only
// ever touch a customer-role user already tied to accountId, enforced by
// checking enterpriseAccountId on every read before writing.

const tenantAccountUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(CUSTOMER_ROLES as [string, ...string[]]),
  restrictedFacilityId: z.string().optional(),
});

export async function createTenantUserForAccount(accountId: string, formData: FormData) {
  const admin = await requireAccountManager();
  const parsed = tenantAccountUserSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    restrictedFacilityId: formData.get("restrictedFacilityId") || undefined,
  });

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const user = await withUniqueConstraintMessage(
    () =>
      prisma.user.create({
        data: {
          name: parsed.name,
          email: parsed.email.toLowerCase().trim(),
          passwordHash,
          role: parsed.role,
          enterpriseAccountId: accountId,
          restrictedFacilityId: parsed.restrictedFacilityId || null,
        },
      }),
    `A user with email "${parsed.email.toLowerCase().trim()}" already exists.`
  );

  await logAudit({
    actorId: admin.id,
    action: "tenant_user.create",
    summary: `Added user ${parsed.name} to tenant account.`,
    targetType: "User",
    targetId: user.id,
  });
  revalidatePath(`/ops/admin/accounts/${accountId}`);
}

const tenantAccountUserUpdateSchema = tenantAccountUserSchema.omit({ password: true });

export async function updateTenantUserForAccount(userId: string, accountId: string, formData: FormData) {
  const admin = await requireAccountManager();
  const existing = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (existing.enterpriseAccountId !== accountId) throw new Error("That user does not belong to this account.");

  const parsed = tenantAccountUserUpdateSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    restrictedFacilityId: formData.get("restrictedFacilityId") || undefined,
  });

  await withUniqueConstraintMessage(
    () =>
      prisma.user.update({
        where: { id: userId },
        data: {
          name: parsed.name,
          email: parsed.email.toLowerCase().trim(),
          role: parsed.role,
          restrictedFacilityId: parsed.restrictedFacilityId || null,
        },
      }),
    `A user with email "${parsed.email.toLowerCase().trim()}" already exists.`
  );

  await logAudit({ actorId: admin.id, action: "tenant_user.update", summary: `Updated user ${parsed.name}.`, targetType: "User", targetId: userId });
  revalidatePath(`/ops/admin/accounts/${accountId}`);
}

export async function toggleTenantAccountUserActive(userId: string, accountId: string) {
  const admin = await requireAccountManager();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.enterpriseAccountId !== accountId) throw new Error("That user does not belong to this account.");

  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  await logAudit({
    actorId: admin.id,
    action: "tenant_user.toggle_active",
    summary: `${user.isActive ? "Disabled" : "Enabled"} user ${user.name}.`,
    targetType: "User",
    targetId: userId,
  });
  revalidatePath(`/ops/admin/accounts/${accountId}`);
}

export async function resetTenantAccountUserPassword(userId: string, accountId: string, formData: FormData) {
  const admin = await requireAccountManager();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.enterpriseAccountId !== accountId) throw new Error("That user does not belong to this account.");

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await logAudit({
    actorId: admin.id,
    action: "tenant_user.reset_password",
    summary: `Reset password for ${user.name}.`,
    targetType: "User",
    targetId: userId,
  });
  revalidatePath(`/ops/admin/accounts/${accountId}`);
}
