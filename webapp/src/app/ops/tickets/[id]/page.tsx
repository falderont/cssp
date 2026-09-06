import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Field, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime, humanize } from "@/lib/utils";
import { assignTicket, updateTicketStatus } from "@/actions/tickets";
import { TICKET_STATUSES, ROLES } from "@/lib/constants";

export default async function OpsTicketDetailPage({ params }: { params: { id: string } }) {
  await requireInternalUser();
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      siteEnrollment: { include: { facility: true, enterpriseAccount: true } },
      assignedToUser: true,
      createdByUser: true,
    },
  });
  if (!ticket) notFound();

  const staff = await prisma.user.findMany({
    where: { role: { in: [ROLES.PROVIDER_CS, ROLES.PROVIDER_CS_MANAGER, ROLES.PROVIDER_OPS, ROLES.SUPER_ADMIN] } },
    orderBy: { name: "asc" },
  });

  const returnPath = `/ops/tickets/${ticket.id}`;
  const assignBound = assignTicket.bind(null, ticket.id, returnPath);
  const statusBound = updateTicketStatus.bind(null, ticket.id, returnPath);

  return (
    <div>
      <PageHeader title={ticket.subject} description={`${ticket.siteEnrollment.enterpriseAccount.name} · ${ticket.siteEnrollment.facility.name}`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center gap-2">
            <Badge>{humanize(ticket.category)}</Badge>
            <StatusBadge status={ticket.status} />
            <Badge tone="slate">{ticket.priority}</Badge>
            {ticket.csatRating && <Badge tone={ticket.csatRating === "up" ? "green" : "red"}>CSAT {ticket.csatRating === "up" ? "👍" : "👎"}</Badge>}
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p className="text-slate-700">{ticket.description}</p>
            <p className="text-xs text-slate-400">Submitted by {ticket.createdByUser.name} on {formatDateTime(ticket.createdAt)}</p>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assign</CardTitle>
            </CardHeader>
            <CardBody>
              <form action={assignBound} className="space-y-3">
                <Field label="Assign to" htmlFor="assignedToId">
                  <Select id="assignedToId" name="assignedToId" defaultValue={ticket.assignedToId ?? ""}>
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button type="submit" className="w-full" variant="secondary">
                  Save assignment
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardBody>
              <form action={statusBound} className="space-y-3">
                <Field label="Status" htmlFor="status">
                  <Select id="status" name="status" defaultValue={ticket.status}>
                    {TICKET_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {humanize(s)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button type="submit" className="w-full">
                  Update &amp; notify tenant
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
