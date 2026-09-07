import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Siren } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { IncidentMatrix } from "@/components/incidents/matrix";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { getFacilityTabAccess } from "@/lib/facility-tabs";

export default async function FacilityIncidentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const { canViewServiceDelivery } = getFacilityTabAccess(user.role);
  if (!canViewServiceDelivery) redirect(`/ops/admin/facilities/${id}`);

  const incidents = await prisma.incident.findMany({
    where: { facilityId: id },
    include: { facility: true, building: true },
    orderBy: { startedAt: "desc" },
    take: 200,
  });
  const ongoing = incidents.filter((i) => i.status !== "Resolved");

  return (
    <div>
      <PageHeader
        title="Incidents"
        actions={
          <LinkButton href={`/ops/incidents/new?facilityId=${id}`}>
            <Plus className="h-4 w-4" /> Post incident
          </LinkButton>
        }
      />
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncidentMatrix incidents={incidents} />
        </div>
        <Card className={ongoing.length > 0 ? "border-red-200" : undefined}>
          <CardHeader className="flex items-center gap-2">
            <Siren className={ongoing.length > 0 ? "h-4 w-4 text-red-500" : "h-4 w-4 text-slate-400"} />
            <CardTitle>Ongoing ({ongoing.length})</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {ongoing.length === 0 && <p className="text-sm text-slate-400">No ongoing incidents.</p>}
            {ongoing.slice(0, 6).map((inc) => (
              <Link
                key={inc.id}
                href={`/ops/incidents/${inc.id}`}
                className="block rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm hover:bg-red-50"
              >
                <div className="flex items-center gap-2">
                  <Badge tone={inc.severity === "P1" || inc.severity === "P2" ? "red" : "amber"}>{inc.severity}</Badge>
                  <span className="font-medium text-slate-800">{inc.title}</span>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <Table>
        <THead>
          <tr>
            <TH>Title</TH>
            <TH>Category</TH>
            <TH>Location</TH>
            <TH>Severity</TH>
            <TH>Status</TH>
            <TH>Visible to tenants</TH>
            <TH>Started</TH>
          </tr>
        </THead>
        <TBody>
          {incidents.length === 0 && <EmptyRow colSpan={7} message="No incidents posted for this site yet." />}
          {incidents.map((inc) => (
            <TR key={inc.id}>
              <TD>
                <Link href={`/ops/incidents/${inc.id}`} className="font-medium text-brand hover:underline">
                  {inc.title}
                </Link>
              </TD>
              <TD>
                <Badge tone="slate">{inc.category}</Badge>
              </TD>
              <TD>
                {inc.building?.name ?? "Facility-wide"}
                {inc.locationDetail && <p className="text-xs text-slate-400">{inc.locationDetail}</p>}
              </TD>
              <TD>
                <Badge tone={inc.severity === "P1" || inc.severity === "P2" ? "red" : "amber"}>{inc.severity}</Badge>
              </TD>
              <TD>
                <StatusBadge status={inc.status} />
              </TD>
              <TD>{inc.isCustomerVisible ? "Yes" : "No"}</TD>
              <TD>{formatDateTime(inc.startedAt)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
