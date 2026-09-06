import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime, humanize } from "@/lib/utils";
import { submitTicketCsat } from "@/actions/tickets";

export default async function PortalTicketDetailPage({ params }: { params: { id: string } }) {
  const user = await requireCustomerUser();
  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, siteEnrollment: { enterpriseAccountId: user.enterpriseAccountId } },
    include: { siteEnrollment: { include: { facility: true } }, assignedToUser: true },
  });
  if (!ticket) notFound();

  const returnPath = `/portal/tickets/${ticket.id}`;
  const csatUpBound = submitTicketCsat.bind(null, ticket.id, "up", returnPath);
  const csatDownBound = submitTicketCsat.bind(null, ticket.id, "down", returnPath);

  return (
    <div>
      <PageHeader title={ticket.subject} description={ticket.siteEnrollment.facility.name} />
      <Card className="max-w-2xl">
        <CardHeader className="flex items-center gap-2">
          <Badge>{humanize(ticket.category)}</Badge>
          <StatusBadge status={ticket.status} />
          <Badge tone="slate">{ticket.priority}</Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-slate-700">{ticket.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Assigned to</p>
              <p className="font-medium text-slate-800">{ticket.assignedToUser?.name ?? "Unassigned"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Submitted</p>
              <p className="font-medium text-slate-800">{formatDateTime(ticket.createdAt)}</p>
            </div>
            {ticket.resolvedAt && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Resolved</p>
                <p className="font-medium text-slate-800">{formatDateTime(ticket.resolvedAt)}</p>
              </div>
            )}
          </div>
          {ticket.status === "Done" && (
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-sm font-medium text-slate-700">How did we do?</p>
              {ticket.csatRating ? (
                <p className="text-sm text-slate-500">Thanks for your feedback ({ticket.csatRating === "up" ? "👍" : "👎"}).</p>
              ) : (
                <div className="flex gap-2">
                  <form action={csatUpBound}>
                    <Button type="submit" size="sm" variant="secondary">
                      👍 Good
                    </Button>
                  </form>
                  <form action={csatDownBound}>
                    <Button type="submit" size="sm" variant="secondary">
                      👎 Not great
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
