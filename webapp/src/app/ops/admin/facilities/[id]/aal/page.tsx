import { notFound, redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decideAalEntry, revokeAalEntry } from "@/actions/aal";
import { AAL_ACCESS_LEVEL_LABELS, isAalExpired } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { getFacilityTabAccess } from "@/lib/facility-tabs";
import { ActionForm } from "@/components/errors/action-form";

export default async function FacilityAalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const { canViewAal, canDecideAal } = getFacilityTabAccess(user.role);
  if (!canViewAal) redirect(`/ops/admin/facilities/${id}`);

  const entries = await prisma.authorizedAccessEntry.findMany({
    where: { facilityId: id },
    include: { enterpriseAccount: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  if (entries.length === 0) {
    const facilityExists = await prisma.facility.findUnique({ where: { id }, select: { id: true } });
    if (!facilityExists) notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorized Access List</CardTitle>
      </CardHeader>
      <Table>
        <THead>
          <tr>
            <TH>Name</TH>
            <TH>Tenant</TH>
            <TH>Access level</TH>
            <TH>Valid until</TH>
            <TH>Status</TH>
            {canDecideAal && <TH>Actions</TH>}
          </tr>
        </THead>
        <TBody>
          {entries.length === 0 && <EmptyRow colSpan={canDecideAal ? 6 : 5} message="No AAL requests for this site yet." />}
          {entries.map((e) => {
            const expired = isAalExpired(e);
            return (
              <TR key={e.id}>
                <TD className="font-medium text-slate-900">
                  {e.fullName}
                  {e.company && <p className="text-xs text-slate-400">{e.company}</p>}
                </TD>
                <TD>{e.enterpriseAccount.name}</TD>
                <TD>{AAL_ACCESS_LEVEL_LABELS[e.accessLevel] ?? e.accessLevel}</TD>
                <TD>{e.validUntil ? formatDate(e.validUntil) : "No expiry"}</TD>
                <TD>
                  <StatusBadge status={expired ? "Expired" : e.status} />
                </TD>
                {canDecideAal && (
                  <TD>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {e.status === "PendingApproval" && (
                        <>
                          <ActionForm action={decideAalEntry.bind(null, e.id, "Active")}>
                            <Button type="submit" size="sm" variant="secondary">
                              Approve
                            </Button>
                          </ActionForm>
                          <ActionForm action={decideAalEntry.bind(null, e.id, "Rejected")}>
                            <Button type="submit" size="sm" variant="danger">
                              Reject
                            </Button>
                          </ActionForm>
                        </>
                      )}
                      {e.status === "Active" && !expired && (
                        <ActionForm action={revokeAalEntry.bind(null, e.id)}>
                          <Button type="submit" size="sm" variant="danger">
                            Revoke
                          </Button>
                        </ActionForm>
                      )}
                    </div>
                  </TD>
                )}
              </TR>
            );
          })}
        </TBody>
      </Table>
    </Card>
  );
}
