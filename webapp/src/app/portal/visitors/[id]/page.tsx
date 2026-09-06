import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { VisitorRequestDetailView } from "@/components/visitors/visitor-request-detail";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PortalVisitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCustomerUser();
  const vr = await prisma.visitorRequest.findFirst({
    where: { id, siteEnrollment: { enterpriseAccountId: user.enterpriseAccountId } },
    include: {
      visitors: true,
      acsLogs: { orderBy: { createdAt: "asc" } },
      building: true,
      hostUser: true,
      createdByUser: true,
      siteEnrollment: { include: { facility: true } },
    },
  });
  if (!vr) notFound();

  return (
    <div>
      <PageHeader title="Visitor request" description={`Submitted ${vr.createdAt.toLocaleDateString()}`} />
      <VisitorRequestDetailView visitorRequest={vr} mode="portal" returnPath={`/portal/visitors/${vr.id}`} />
    </div>
  );
}
