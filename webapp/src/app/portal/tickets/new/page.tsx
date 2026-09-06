import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Select, Textarea, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireCustomerUser } from "@/lib/session";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import { createTicket } from "@/actions/tickets";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/lib/constants";
import { humanize } from "@/lib/utils";

export default async function NewTicketPage() {
  const user = await requireCustomerUser();
  const enrollments = await getCustomerSiteEnrollments(user);

  return (
    <div>
      <PageHeader title="New ticket" description="Raise a complaint, a request for information, or a service request." />
      <Card className="max-w-2xl">
        <CardBody>
          <form action={createTicket} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Site" htmlFor="siteEnrollmentId" required>
                <Select id="siteEnrollmentId" name="siteEnrollmentId" required>
                  {enrollments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.facility.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Category" htmlFor="category" required>
                <Select id="category" name="category" required defaultValue="ServiceRequest">
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {humanize(c)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Priority" htmlFor="priority" required>
                <Select id="priority" name="priority" required defaultValue="Normal">
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Subject" htmlFor="subject" required>
              <Input id="subject" name="subject" required placeholder="Short summary" />
            </Field>
            <Field label="Description" htmlFor="description" required>
              <Textarea id="description" name="description" required placeholder="Details…" />
            </Field>
            <Button type="submit">Submit ticket</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
