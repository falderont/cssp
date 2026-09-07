import { redirect } from "next/navigation";
import { SiteTabs, type SiteTab } from "@/components/admin/site-tabs";
import { requireFacilityPageAccess } from "@/lib/session";
import { getFacilityTabAccess } from "@/lib/facility-tabs";

export default async function FrontLineLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const { canViewFrontLine } = getFacilityTabAccess(user.role);
  if (!canViewFrontLine) redirect(`/ops/admin/facilities/${id}`);

  const base = `/ops/admin/facilities/${id}/front-line`;
  const tabs: SiteTab[] = [
    { href: `${base}/visitors`, label: "Visitor approvals" },
    { href: `${base}/front-desk`, label: "Front desk" },
    { href: `${base}/deliveries`, label: "Deliveries" },
  ];

  return (
    <div>
      <SiteTabs tabs={tabs} variant="secondary" />
      {children}
    </div>
  );
}
