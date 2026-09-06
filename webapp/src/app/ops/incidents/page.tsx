import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function OpsIncidentsPage() {
  await requireInternalUser();
  const incidents = await prisma.incident.findMany({
    include: { facility: true, building: true },
    orderBy: { startedAt: "desc" },
    take: 200,
  });

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
      <Table>
        <THead>
          <tr>
            <TH>Title</TH>
            <TH>Facility</TH>
            <TH>Severity</TH>
            <TH>Status</TH>
            <TH>Visible to tenants</TH>
            <TH>Started</TH>
          </tr>
        </THead>
        <TBody>
          {incidents.length === 0 && <EmptyRow colSpan={6} message="No incidents posted yet." />}
          {incidents.map((inc) => (
            <TR key={inc.id}>
              <TD>
                <Link href={`/ops/incidents/${inc.id}`} className="font-medium text-brand hover:underline">
                  {inc.title}
                </Link>
              </TD>
              <TD>
                {inc.facility.name}
                {inc.building ? ` · ${inc.building.name}` : ""}
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
