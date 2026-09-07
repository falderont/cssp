import { redirect } from "next/navigation";
import { SiteTabs, type SiteTab } from "@/components/admin/site-tabs";
import { requireFacilityPageAccess } from "@/lib/session";
import { getFacilityTabAccess } from "@/lib/facility-tabs";

export default async function ServiceDeliveryLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const { canViewServiceDelivery, canViewTelemetry } = getFacilityTabAccess(user.role);
  if (!canViewServiceDelivery) redirect(`/ops/admin/facilities/${id}`);

  const base = `/ops/admin/facilities/${id}/service-delivery`;
  const tabs: SiteTab[] = [
    { href: `${base}/incidents`, label: "Incidents" },
    { href: `${base}/maintenance`, label: "Maintenance" },
    { href: `${base}/service-requests`, label: "Service requests" },
    ...(canViewTelemetry ? [{ href: `${base}/telemetry`, label: "Telemetry (BMS)" }] : []),
  ];

  return (
    <div>
      <SiteTabs tabs={tabs} variant="secondary" />
      {children}
    </div>
  );
}
