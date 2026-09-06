import "server-only";
import { prisma } from "@/lib/db";
import { Role } from "@/lib/generated/prisma/client";

type AuthLookupRow = {
  id: string;
  organization_id: string;
  password_hash: string;
  role: string;
  name: string;
  email: string;
  enterprise_account_id: string | null;
  site_enrollment_id: string | null;
};

/**
 * The one place in the app that reads the `users` table without a tenant
 * context already established — see prisma/migrations/.../auth_lookup_function
 * for why this goes through a SECURITY DEFINER function instead of a normal
 * Prisma query (which RLS would refuse outright, correctly, since we don't
 * know the organization yet).
 */
export async function findUserForLogin(email: string) {
  const rows = await prisma.$queryRaw<AuthLookupRow[]>`SELECT * FROM auth_lookup_user(${email})`;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    passwordHash: row.password_hash,
    role: row.role as Role,
    name: row.name,
    email: row.email,
    enterpriseAccountId: row.enterprise_account_id,
    siteEnrollmentId: row.site_enrollment_id,
  };
}
