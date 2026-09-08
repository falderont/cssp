import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { PortalVisitorsTable } from "@/components/visitors/portal-visitors-table";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds } from "@/lib/scope";

export default async function PortalVisitorsPage() {
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);

  const requests = await prisma.visitorRequest.findMany({
    where: { siteEnrollment: { enterpriseAccountId: user.enterpriseAccountId, facilityId: { in: facilityIds } } },
    include: { visitors: true, siteEnrollment: { include: { facility: true } }, building: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Visitors"
        description="Register visitors — one at a time or as a group — and track approval and access-control sync."
        actions={
          <>
            <LinkButton href="/portal/visitors/new?mode=batch" variant="secondary">
              <Upload className="h-4 w-4" /> Batch upload
            </LinkButton>
            <LinkButton href="/portal/visitors/new">
              <Plus className="h-4 w-4" /> New visitor request
            </LinkButton>
          </>
        }
      />
      <PortalVisitorsTable requests={requests} />
    </div>
  );
}
