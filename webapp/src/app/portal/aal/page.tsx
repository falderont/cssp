import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalAalTable } from "@/components/aal/portal-aal-table";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireTenantAdminOrSiteLead } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import { requestAalEntry } from "@/actions/aal";
import { AAL_ACCESS_LEVELS, AAL_ACCESS_LEVEL_LABELS } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

export default async function PortalAalPage() {
  const user = await requireTenantAdminOrSiteLead();
  const [entries, enrollments] = await Promise.all([
    prisma.authorizedAccessEntry.findMany({
      where: { enterpriseAccountId: user.enterpriseAccountId, ...(user.restrictedFacilityId ? { facilityId: user.restrictedFacilityId } : {}) },
      include: { facility: true },
      orderBy: { createdAt: "desc" },
    }),
    getCustomerSiteEnrollments(user),
  ]);

  return (
    <div>
      <PageHeader
        title="Authorized Access List"
        description="Permanent, undated access for named contractors or long-term staff — reviewed and approved by the site's operations team."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PortalAalTable entries={entries} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request access</CardTitle>
          </CardHeader>
          <CardBody>
            <ActionForm action={requestAalEntry} className="space-y-3">
              <Field label="Site" htmlFor="facilityId" required>
                <Select id="facilityId" name="facilityId" required>
                  {enrollments.map((e) => (
                    <option key={e.facilityId} value={e.facilityId}>
                      {e.facility.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Full name" htmlFor="fullName" required>
                <Input id="fullName" name="fullName" required />
              </Field>
              <Field label="Company (optional)" htmlFor="company">
                <Input id="company" name="company" />
              </Field>
              <Field label="ID type (optional)" htmlFor="idType">
                <Input id="idType" name="idType" placeholder="Passport, national ID…" />
              </Field>
              <Field label="ID number (optional)" htmlFor="idNumber">
                <Input id="idNumber" name="idNumber" />
              </Field>
              <Field label="Access level" htmlFor="accessLevel" required>
                <Select id="accessLevel" name="accessLevel" required defaultValue="Standard">
                  {AAL_ACCESS_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {AAL_ACCESS_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Valid until (optional)" htmlFor="validUntil" hint="Leave blank for no fixed expiry">
                <Input id="validUntil" name="validUntil" type="date" />
              </Field>
              <Field label="Reason" htmlFor="reason" required>
                <Textarea id="reason" name="reason" required placeholder="Why does this person need permanent access?" />
              </Field>
              <Button type="submit" className="w-full">
                Submit request
              </Button>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
