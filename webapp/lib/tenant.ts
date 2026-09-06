import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export type Tx = Prisma.TransactionClient;

/**
 * Every data-access call in the app goes through this. It opens one Postgres
 * transaction, sets the session-local `app.organization_id` GUC that
 * prisma/rls.sql's policies check, and hands the transaction client to the
 * callback — so every query the callback makes is scoped to that tenant by
 * Postgres itself, not by remembering a WHERE clause. See docs/prd-v3.md
 * Section 3 and prisma/rls.sql for why this is enforced at the database layer.
 *
 * `set_config` (not a raw `SET LOCAL ${orgId}` string) so the value is a bound
 * parameter, not interpolated SQL.
 */
export async function withTenant<T>(
  organizationId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, true)`;
    return fn(tx);
  });
}
