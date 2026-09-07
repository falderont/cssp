import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireTenantAdminOrSiteLead } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerSiteEnrollments } from "@/lib/scope";
import { requestAalEntry } from "@/actions/aal";
import { AAL_ACCESS_LEVELS, AAL_ACCESS_LEVEL_LABELS, isAalExpired } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
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
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Site</TH>
                <TH>Access level</TH>
                <TH>Valid until</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {entries.length === 0 && <EmptyRow colSpan={5} message="No authorized access entries yet." />}
              {entries.map((e) => (
                <TR key={e.id}>
                  <TD className="font-medium text-slate-900">
                    {e.fullName}
                    {e.company && <p className="text-xs text-slate-400">{e.company}</p>}
                  </TD>
                  <TD>{e.facility.name}</TD>
                  <TD>{AAL_ACCESS_LEVEL_LABELS[e.accessLevel] ?? e.accessLevel}</TD>
                  <TD>{e.validUntil ? formatDate(e.validUntil) : "No expiry"}</TD>
                  <TD>
                    <StatusBadge status={isAalExpired(e) ? "Expired" : e.status} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
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
