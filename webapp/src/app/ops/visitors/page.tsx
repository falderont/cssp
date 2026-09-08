import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { OpsVisitorsTable } from "@/components/visitors/ops-visitors-table";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";

// Visitor Approvals now lives as a tab on each site's own management page —
// a viewer pinned to one facility goes straight there. Cross-site roles
// (Service Desk, an unrestricted Site Manager, ...) keep this page exactly
// as before: they need everything in one list, not site by site.
export default async function OpsVisitorsPage() {
  const user = await requireInternalUser();
  if (user.restrictedFacilityId) redirect(`/ops/admin/facilities/${user.restrictedFacilityId}/front-line/visitors`);
  const scopedFacilityIds = await getOpsFacilityIds(user);

  const requests = await prisma.visitorRequest.findMany({
    where: scopedFacilityIds ? { siteEnrollment: { facilityId: { in: scopedFacilityIds } } } : undefined,
    include: {
      visitors: true,
      siteEnrollment: { include: { facility: true, enterpriseAccount: true } },
      building: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Visitor approvals" description="Approve, deny, check in/out, and monitor access-control sync across every site and tenant." />
      <OpsVisitorsTable requests={requests} />
    </div>
  );
}
