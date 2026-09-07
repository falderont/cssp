import { redirect } from "next/navigation";
import Link from "next/link";
import { IdCard } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";

// Authorized Access List requests are now decided right on each site's own
// page (see /ops/admin/facilities/[id]) instead of one flat cross-site list.
// This page is just the way in: straight to your one site if your scope is
// exactly one facility, otherwise a picker (with a pending-count nudge so
// nothing waiting for a decision gets lost across sites).
export default async function OpsAalPage() {
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  if (scopedFacilityIds && scopedFacilityIds.length === 1) redirect(`/ops/admin/facilities/${scopedFacilityIds[0]}/aal`);

  const [facilities, pendingCounts] = await Promise.all([
    prisma.facility.findMany({
      where: scopedFacilityIds ? { id: { in: scopedFacilityIds } } : undefined,
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.authorizedAccessEntry.groupBy({
      by: ["facilityId"],
      where: { status: "PendingApproval", ...(scopedFacilityIds ? { facilityId: { in: scopedFacilityIds } } : {}) },
      _count: { _all: true },
    }),
  ]);
  const pendingByFacility = new Map(pendingCounts.map((p) => [p.facilityId, p._count._all]));

  return (
    <div>
      <PageHeader
        title="Authorized Access List"
        description="Pick a site — AAL requests are approved, rejected and revoked on that site's own page."
      />
      <Card>
        <CardBody className="divide-y divide-slate-100 p-0">
          {facilities.length === 0 && <p className="p-4 text-sm text-slate-400">No sites in your scope yet.</p>}
          {facilities.map((f) => {
            const pending = pendingByFacility.get(f.id) ?? 0;
            return (
              <Link
                key={f.id}
                href={`/ops/admin/facilities/${f.id}/aal`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 font-medium text-slate-900">
                  <IdCard className="h-4 w-4 text-slate-400" /> {f.name}
                  <span className="font-normal text-slate-400">({f.code})</span>
                </span>
                {pending > 0 && <Badge tone="amber">{pending} pending</Badge>}
              </Link>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
