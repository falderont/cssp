import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { TelemetryTable } from "@/components/telemetry/telemetry-table";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";

// Telemetry (BMS) now lives entirely as a tab on each site's own management
// page — a viewer pinned to one facility goes straight there. This stays as
// a picker for anyone who can see more than one site.
export default async function OpsTelemetryPage() {
  const user = await requireInternalUser();
  if (user.restrictedFacilityId) redirect(`/ops/admin/facilities/${user.restrictedFacilityId}/service-delivery/telemetry`);
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const facilities = await prisma.facility.findMany({
    where: scopedFacilityIds ? { id: { in: scopedFacilityIds } } : undefined,
    include: { telemetrySource: true, city: { include: { country: { include: { region: true } } } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="BMS Telemetry"
        description="Optional per-facility integration into your building management system — pick a site to view its telemetry and integration settings."
      />
      <TelemetryTable facilities={facilities} />
    </div>
  );
}
