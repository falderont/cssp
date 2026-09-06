import "server-only";
import type { Tx } from "@/lib/tenant";
import type { SessionPayload } from "@/lib/auth/session";

/**
 * Resolves what a customer session can see: a Site Contact is pinned to their
 * own site enrollment no matter what's in the URL; a Global Admin sees a
 * roll-up across every site enrollment on the account, or narrows to one via
 * ?site=<id> (components/shell/site-switcher.tsx) — see docs/prd-v3.md
 * Section 4. `facilityIds` is separate because Incidents/BMS are
 * facility-scoped, not site-enrollment-scoped (a facility can host more than
 * one enterprise account's enrollment).
 */
export async function resolvePortalScope(tx: Tx, session: SessionPayload, requestedSiteId?: string) {
  const enrollments = await tx.siteEnrollment.findMany({
    where:
      session.role === "CUSTOMER_SITE"
        ? { id: session.siteEnrollmentId! }
        : { enterpriseAccountId: session.enterpriseAccountId! },
    include: { facility: { include: { region: true } } },
    orderBy: { facility: { name: "asc" } },
  });

  const selected =
    session.role === "CUSTOMER_SITE"
      ? session.siteEnrollmentId!
      : requestedSiteId && enrollments.some((e) => e.id === requestedSiteId)
        ? requestedSiteId
        : "all";

  const scopedEnrollments = selected === "all" ? enrollments : enrollments.filter((e) => e.id === selected);

  return {
    enrollments,
    selected,
    siteEnrollmentIds: scopedEnrollments.map((e) => e.id),
    facilityIds: [...new Set(scopedEnrollments.map((e) => e.facilityId))],
    canSwitch: session.role === "CUSTOMER_GLOBAL" && enrollments.length > 1,
  };
}

export type PortalScope = Awaited<ReturnType<typeof resolvePortalScope>>;
