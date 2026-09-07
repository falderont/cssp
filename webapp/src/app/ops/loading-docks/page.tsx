import { redirect } from "next/navigation";
import Link from "next/link";
import { Warehouse } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { requireBuildingManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Loading dock locations are now managed right on each site's own page (see
// /ops/admin/facilities/[id]) instead of duplicating them here as a separate
// flat master-data-style list. This page is just the way in: straight to
// your one site if you're restricted to one, otherwise a picker.
export default async function LoadingDocksPage() {
  const user = await requireBuildingManager();
  if (user.restrictedFacilityId) redirect(`/ops/admin/facilities/${user.restrictedFacilityId}/loading-docks`);

  const facilities = await prisma.facility.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, _count: { select: { loadingDocks: true } } },
  });

  return (
    <div>
      <PageHeader title="Loading docks" description="Pick a site — loading dock locations are managed on that site's own page." />
      <Card>
        <CardBody className="divide-y divide-slate-100 p-0">
          {facilities.length === 0 && <p className="p-4 text-sm text-slate-400">No sites yet.</p>}
          {facilities.map((f) => (
            <Link
              key={f.id}
              href={`/ops/admin/facilities/${f.id}/loading-docks`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 font-medium text-slate-900">
                <Warehouse className="h-4 w-4 text-slate-400" /> {f.name}
                <span className="font-normal text-slate-400">({f.code})</span>
              </span>
              <span className="text-xs text-slate-400">
                {f._count.loadingDocks} dock{f._count.loadingDocks === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
