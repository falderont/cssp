import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { VisitorRequestForm } from "@/components/visitors/visitor-request-form";
import { requireCustomerUser } from "@/lib/session";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import { prisma } from "@/lib/prisma";

export default async function NewVisitorRequestPage() {
  const user = await requireCustomerUser();
  const enrollments = await getCustomerSiteEnrollments(user);
  const hostUsers = await prisma.user.findMany({
    where: { enterpriseAccountId: user.enterpriseAccountId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="New visitor request" description="Register one visitor, or add several under the same visit." />
      <Card className="max-w-3xl">
        <CardBody>
          <VisitorRequestForm enrollments={enrollments} hostUsers={hostUsers} />
        </CardBody>
      </Card>
    </div>
  );
}
