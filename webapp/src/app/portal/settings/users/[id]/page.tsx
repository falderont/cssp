import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { TenantUserEditForm } from "@/components/tenant/tenant-user-edit-form";
import { requireTenantGlobalAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import type { Role } from "@/lib/constants";

export default async function EditTenantUserPage({ params }: { params: { id: string } }) {
  const admin = await requireTenantGlobalAdmin();
  const [target, enrollments] = await Promise.all([
    prisma.user.findFirst({ where: { id: params.id, enterpriseAccountId: admin.enterpriseAccountId } }),
    getCustomerSiteEnrollments(admin),
  ]);
  if (!target) notFound();

  const facilities = enrollments.map((e) => ({ id: e.facilityId, name: e.facility.name }));

  return (
    <div>
      <PageHeader title={target.name} description={target.email} />
      <Card className="max-w-lg">
        <CardBody>
          <TenantUserEditForm
            userId={target.id}
            currentRole={target.role as Role}
            currentFacilityId={target.restrictedFacilityId}
            facilities={facilities}
          />
        </CardBody>
      </Card>
    </div>
  );
}
