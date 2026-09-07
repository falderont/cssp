import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton, Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";
import { decideAreaChangeRequest } from "@/actions/area";
import { formatDateTime } from "@/lib/utils";

export default async function AreaChangeRequestsPage() {
  const user = await requireInternalUser();
  const isMasterDataAdmin = user.role === ROLES.SYS_ADMIN || user.role === ROLES.SERVICE_DESK;

  const requests = await prisma.areaChangeRequest.findMany({
    where: isMasterDataAdmin ? undefined : { requestedById: user.id },
    include: { requestedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Area change requests"
        description={
          isMasterDataAdmin
            ? "Internal tickets requesting changes to Area master data (Region/Country/City/Site/Building/Room) — triage and apply."
            : "Master data (Region/Country/City/Site/Building/Room) is managed by Global Admin and Service Desk. Raise a ticket here to request a change."
        }
        actions={
          <LinkButton href="/ops/admin/area-change-requests/new">
            <Plus className="h-4 w-4" /> New request
          </LinkButton>
        }
      />
      <Table>
        <THead>
          <tr>
            <TH>Level</TH>
            <TH>Action</TH>
            <TH>Context</TH>
            <TH>Requested by</TH>
            <TH>Status</TH>
            <TH>Submitted</TH>
            {isMasterDataAdmin && <TH>Decide</TH>}
          </tr>
        </THead>
        <TBody>
          {requests.length === 0 && <EmptyRow colSpan={isMasterDataAdmin ? 7 : 6} message="No area change requests yet." />}
          {requests.map((r) => (
            <TR key={r.id}>
              <TD>{r.level}</TD>
              <TD>{r.action}</TD>
              <TD className="max-w-xs">
                <p className="font-medium text-slate-900">{r.context}</p>
                {(r.proposedName || r.proposedCode) && (
                  <p className="text-xs text-slate-500">
                    {r.proposedName}
                    {r.proposedCode ? ` (${r.proposedCode})` : ""}
                  </p>
                )}
                <p className="text-xs text-slate-500">{r.notes}</p>
              </TD>
              <TD>{r.requestedBy.name}</TD>
              <TD>
                <StatusBadge status={r.status} />
              </TD>
              <TD>{formatDateTime(r.createdAt)}</TD>
              {isMasterDataAdmin && (
                <TD>
                  <form action={decideAreaChangeRequest.bind(null, r.id)} className="flex items-center gap-2">
                    <Select name="status" defaultValue={r.status} className="w-36 py-1 text-xs">
                      <option value="Submitted">Submitted</option>
                      <option value="InReview">In Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Applied">Applied</option>
                    </Select>
                    <Button type="submit" variant="secondary" className="px-2 py-1 text-xs">
                      Save
                    </Button>
                  </form>
                </TD>
              )}
            </TR>
          ))}
        </TBody>
      </Table>
      {!isMasterDataAdmin && (
        <Card className="mt-4">
          <CardBody className="text-sm text-slate-500">
            You can only edit Area master data directly if you're a Global Sys Admin or Service Desk. See{" "}
            <Link href="/ops/admin/area-change-requests/new" className="text-brand hover:underline">
              New request
            </Link>{" "}
            to ask for a change.
          </CardBody>
        </Card>
      )}
    </div>
  );
}
