import { notFound, redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { FacilityAalTable } from "@/components/aal/facility-aal-table";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getFacilityTabAccess } from "@/lib/facility-tabs";

export default async function FacilityAalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const { canViewAal, canDecideAal } = getFacilityTabAccess(user.role);
  if (!canViewAal) redirect(`/ops/admin/facilities/${id}`);

  const [entries, enrollments] = await Promise.all([
    prisma.authorizedAccessEntry.findMany({
      where: { facilityId: id },
      include: { enterpriseAccount: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    canDecideAal
      ? prisma.siteEnrollment.findMany({
          where: { facilityId: id },
          include: { enterpriseAccount: true },
          orderBy: [{ enterpriseAccount: { name: "asc" } }],
        })
      : Promise.resolve([]),
  ]);
  if (entries.length === 0) {
    const facilityExists = await prisma.facility.findUnique({ where: { id }, select: { id: true } });
    if (!facilityExists) notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorized Access List</CardTitle>
      </CardHeader>
      <div className="border-t border-slate-100 p-[var(--pad-card-x)]">
        <FacilityAalTable entries={entries} canDecide={canDecideAal} enrollments={enrollments} />
      </div>
    </Card>
  );
}
