import Link from "next/link";
import { Plus, Siren } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { IncidentMatrix } from "@/components/incidents/matrix";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { formatDateTime } from "@/lib/utils";

export default async function OpsIncidentsPage() {
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const incidents = await prisma.incident.findMany({
    where: scopedFacilityIds ? { facilityId: { in: scopedFacilityIds } } : undefined,
    include: { facility: true, building: true },
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  const ongoing = incidents.filter((i) => i.status !== "Resolved");

  return (
    <div>
      <PageHeader
        title="Incidents"
        description="Publish and manage incidents across every facility — this stands in for the manual adapter over your DCIM/CMMS."
        actions={
          <LinkButton href="/ops/incidents/new">
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
                <p className="mt-0.5 text-xs text-slate-500">{inc.facility.name}</p>
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
            <TH>Facility / location</TH>
            <TH>Severity</TH>
            <TH>Status</TH>
            <TH>Visible to tenants</TH>
            <TH>Started</TH>
          </tr>
        </THead>
        <TBody>
          {incidents.length === 0 && <EmptyRow colSpan={7} message="No incidents posted yet." />}
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
                {inc.facility.name}
                {inc.building ? ` · ${inc.building.name}` : ""}
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
