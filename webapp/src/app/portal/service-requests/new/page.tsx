import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { ServiceRequestForm } from "@/components/service-requests/service-request-form";
import { requireCustomerUser } from "@/lib/session";
import { getCustomerSiteEnrollments, getMeetingRequestContacts } from "@/lib/scope";

export default async function NewServiceRequestPage() {
  const user = await requireCustomerUser();
  const enrollments = await getCustomerSiteEnrollments(user);

  const facilityIds = Array.from(new Set(enrollments.map((e) => e.facilityId)));
  const contactsByFacility = new Map(
    await Promise.all(facilityIds.map(async (id) => [id, await getMeetingRequestContacts(id)] as const))
  );
  const enrollmentsWithContacts = enrollments.map((e) => ({
    ...e,
    meetingContacts: contactsByFacility.get(e.facilityId) ?? [],
  }));

  return (
    <div>
      <PageHeader
        title="New service request"
        description="A complaint, a request for information, a site walk/escort, a meeting, or remote/smart hands."
      />
      <Card className="max-w-2xl">
        <CardBody>
          <ServiceRequestForm enrollments={enrollmentsWithContacts} />
        </CardBody>
      </Card>
    </div>
  );
}
