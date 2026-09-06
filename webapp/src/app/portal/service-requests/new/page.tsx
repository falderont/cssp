import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { ServiceRequestForm } from "@/components/service-requests/service-request-form";
import { requireCustomerUser } from "@/lib/session";
import { getCustomerSiteEnrollments } from "@/lib/scope";

export default async function NewServiceRequestPage() {
  const user = await requireCustomerUser();
  const enrollments = await getCustomerSiteEnrollments(user);

  return (
    <div>
      <PageHeader
        title="New service request"
        description="A complaint, a request for information, a site walk/escort, a meeting, or remote/smart hands."
      />
      <Card className="max-w-2xl">
        <CardBody>
          <ServiceRequestForm enrollments={enrollments} />
        </CardBody>
      </Card>
    </div>
  );
}
