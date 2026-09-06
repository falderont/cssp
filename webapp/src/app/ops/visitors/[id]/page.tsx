import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { VisitorRequestDetailView } from "@/components/visitors/visitor-request-detail";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function OpsVisitorDetailPage({ params }: { params: { id: string } }) {
  await requireInternalUser();
  const vr = await prisma.visitorRequest.findUnique({
    where: { id: params.id },
    include: {
      visitors: true,
      acsLogs: { orderBy: { createdAt: "asc" } },
      building: true,
      hostUser: true,
      createdByUser: true,
      siteEnrollment: { include: { facility: true, enterpriseAccount: true } },
    },
  });
  if (!vr) notFound();

  return (
    <div>
      <PageHeader title={vr.siteEnrollment.enterpriseAccount.name} description="Visitor request detail" />
      <VisitorRequestDetailView visitorRequest={vr} mode="ops" returnPath={`/ops/visitors/${vr.id}`} />
    </div>
  );
}
