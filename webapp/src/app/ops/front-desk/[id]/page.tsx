import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { VisitorRequestDetailView } from "@/components/visitors/visitor-request-detail";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function FrontDeskTicketPage({ params }: { params: { id: string } }) {
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
      <PageHeader
        title={vr.siteEnrollment.enterpriseAccount.name}
        description="Visitor ticket — full reservation details as submitted by the requestor."
        actions={<LinkButton href="/ops/front-desk" variant="secondary">Back to Front Desk</LinkButton>}
      />
      <VisitorRequestDetailView visitorRequest={vr} mode="ops" returnPath={`/ops/front-desk/${vr.id}`} />
    </div>
  );
}
