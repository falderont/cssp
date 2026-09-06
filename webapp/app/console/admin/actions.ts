"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canManageProviderSetup, assert } from "@/lib/rbac";
import { hashPassword } from "@/lib/auth/passwords";

type FormState = { error?: string } | undefined;

function fail(message: string): FormState {
  return { error: message };
}

export async function createRegion(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assert(canManageProviderSetup(session.role));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("Name is required.");

  await withTenant(session.organizationId, (tx) =>
    tx.region.create({ data: { organizationId: session.organizationId, name } }),
  );
  revalidatePath("/console/admin");
  return undefined;
}

const FacilitySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  address: z.string().trim().min(1, "Address is required."),
  timezone: z.string().trim().min(1, "Timezone is required."),
  regionId: z.string().optional(),
});

export async function createFacility(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assert(canManageProviderSetup(session.role));
  const parsed = FacilitySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    timezone: formData.get("timezone"),
    regionId: (formData.get("regionId") as string) || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  await withTenant(session.organizationId, (tx) =>
    tx.facility.create({
      data: {
        organizationId: session.organizationId,
        name: parsed.data.name,
        address: parsed.data.address,
        timezone: parsed.data.timezone,
        regionId: parsed.data.regionId || null,
      },
    }),
  );
  revalidatePath("/console/admin");
  return undefined;
}

export async function createBuilding(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assert(canManageProviderSetup(session.role));
  const name = String(formData.get("name") ?? "").trim();
  const facilityId = String(formData.get("facilityId") ?? "");
  if (!name || !facilityId) return fail("Name and facility are required.");

  await withTenant(session.organizationId, (tx) =>
    tx.building.create({ data: { organizationId: session.organizationId, facilityId, name } }),
  );
  revalidatePath("/console/admin");
  return undefined;
}

export async function createEnterpriseAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assert(canManageProviderSetup(session.role));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("Name is required.");

  await withTenant(session.organizationId, (tx) =>
    tx.enterpriseAccount.create({ data: { organizationId: session.organizationId, name } }),
  );
  revalidatePath("/console/admin");
  return undefined;
}

export async function createSiteEnrollment(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assert(canManageProviderSetup(session.role));
  const enterpriseAccountId = String(formData.get("enterpriseAccountId") ?? "");
  const facilityId = String(formData.get("facilityId") ?? "");
  if (!enterpriseAccountId || !facilityId) return fail("Account and facility are required.");

  await withTenant(session.organizationId, async (tx) => {
    const existing = await tx.siteEnrollment.findUnique({
      where: { enterpriseAccountId_facilityId: { enterpriseAccountId, facilityId } },
    });
    assert(!existing, "That account is already enrolled at that facility.");
    await tx.siteEnrollment.create({
      data: { organizationId: session.organizationId, enterpriseAccountId, facilityId },
    });
  });
  revalidatePath("/console/admin");
  return undefined;
}

const UserSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum([
    "CUSTOMER_GLOBAL",
    "CUSTOMER_SITE",
    "PROVIDER_ADMIN",
    "PROVIDER_CS",
    "PROVIDER_CS_MANAGER",
    "PROVIDER_OPS",
    "PROVIDER_SECURITY",
    "PROVIDER_TECHNICIAN",
  ]),
  enterpriseAccountId: z.string().optional(),
  siteEnrollmentId: z.string().optional(),
});

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assert(canManageProviderSetup(session.role));
  const parsed = UserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    enterpriseAccountId: (formData.get("enterpriseAccountId") as string) || undefined,
    siteEnrollmentId: (formData.get("siteEnrollmentId") as string) || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");

  const isCustomerRole = parsed.data.role === "CUSTOMER_GLOBAL" || parsed.data.role === "CUSTOMER_SITE";
  if (isCustomerRole && !parsed.data.enterpriseAccountId) {
    return fail("Customer users need an enterprise account.");
  }
  if (parsed.data.role === "CUSTOMER_SITE" && !parsed.data.siteEnrollmentId) {
    return fail("A Site Contact needs a specific site enrollment.");
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    await withTenant(session.organizationId, (tx) =>
      tx.user.create({
        data: {
          organizationId: session.organizationId,
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          role: parsed.data.role,
          enterpriseAccountId: isCustomerRole ? parsed.data.enterpriseAccountId : null,
          siteEnrollmentId: parsed.data.role === "CUSTOMER_SITE" ? parsed.data.siteEnrollmentId : null,
        },
      }),
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return fail("A user with that email already exists.");
    }
    throw err;
  }

  revalidatePath("/console/admin");
  return undefined;
}
