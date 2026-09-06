import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { decideAalEntry, revokeAalEntry } from "@/actions/aal";
import { AAL_ACCESS_LEVEL_LABELS, ROLES, isAalExpired } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default async function OpsAalPage() {
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const canDecide = user.role === ROLES.SYS_ADMIN || user.role === ROLES.OPS_SITE_MANAGER;

  const entries = await prisma.authorizedAccessEntry.findMany({
    where: scopedFacilityIds ? { facilityId: { in: scopedFacilityIds } } : undefined,
    include: { facility: true, enterpriseAccount: true, requestedBy: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        title="Authorized Access List"
        description="Permanent access requests from tenants — a one-time decision, distinct from a dated visitor ticket."
      />
      <Table>
        <THead>
          <tr>
            <TH>Name</TH>
            <TH>Tenant</TH>
            <TH>Site</TH>
            <TH>Access level</TH>
            <TH>Valid until</TH>
            <TH>Status</TH>
            {canDecide && <TH>Actions</TH>}
          </tr>
        </THead>
        <TBody>
          {entries.length === 0 && <EmptyRow colSpan={canDecide ? 7 : 6} message="No AAL requests yet." />}
          {entries.map((e) => {
            const approveBound = decideAalEntry.bind(null, e.id, "Active");
            const rejectBound = decideAalEntry.bind(null, e.id, "Rejected");
            const revokeBound = revokeAalEntry.bind(null, e.id);
            const expired = isAalExpired(e);
            return (
              <TR key={e.id}>
                <TD className="font-medium text-slate-900">
                  {e.fullName}
                  {e.company && <p className="text-xs text-slate-400">{e.company}</p>}
                  <p className="text-xs text-slate-400">{e.reason}</p>
                </TD>
                <TD>{e.enterpriseAccount.name}</TD>
                <TD>{e.facility.name}</TD>
                <TD>{AAL_ACCESS_LEVEL_LABELS[e.accessLevel] ?? e.accessLevel}</TD>
                <TD>{e.validUntil ? formatDate(e.validUntil) : "No expiry"}</TD>
                <TD>
                  <StatusBadge status={expired ? "Expired" : e.status} />
                </TD>
                {canDecide && (
                  <TD>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {e.status === "PendingApproval" && (
                        <>
                          <form action={approveBound}>
                            <Button type="submit" size="sm" variant="secondary">
                              Approve
                            </Button>
                          </form>
                          <form action={rejectBound}>
                            <Button type="submit" size="sm" variant="danger">
                              Reject
                            </Button>
                          </form>
                        </>
                      )}
                      {e.status === "Active" && !expired && (
                        <form action={revokeBound}>
                          <Button type="submit" size="sm" variant="danger">
                            Revoke
                          </Button>
                        </form>
                      )}
                    </div>
                  </TD>
                )}
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
