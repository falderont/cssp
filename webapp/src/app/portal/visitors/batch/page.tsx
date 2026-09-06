import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { VisitorBatchForm } from "@/components/visitors/visitor-batch-form";
import { requireCustomerUser } from "@/lib/session";
import { getCustomerSiteEnrollments } from "@/lib/scope";

export default async function BatchVisitorRequestPage() {
  const user = await requireCustomerUser();
  const enrollments = await getCustomerSiteEnrollments(user);

  return (
    <div>
      <PageHeader title="Batch visitor upload" description="Upload an Excel (or CSV) list to register a group of visitors in one go — a contractor crew, an audit team, and so on." />
      <Card className="max-w-3xl">
        <CardBody>
          <VisitorBatchForm enrollments={enrollments} />
        </CardBody>
      </Card>
    </div>
  );
}
