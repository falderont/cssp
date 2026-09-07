import { redirect } from "next/navigation";
import { requireInternalUser } from "@/lib/session";

// This page's content moved to the site's own Telemetry tab (Site
// Integration + Telemetry both being purely per-facility, unlike
// Incidents/Maintenance/Service Requests — see /ops/admin/facilities/[id]/
// service-delivery/telemetry). Nothing here needed a cross-site queue, so
// this is a straight redirect rather than a picker.
export default async function OpsTelemetryFacilityRedirect({ params }: { params: Promise<{ facilityId: string }> }) {
  const { facilityId } = await params;
  await requireInternalUser();
  redirect(`/ops/admin/facilities/${facilityId}/service-delivery/telemetry`);
}
