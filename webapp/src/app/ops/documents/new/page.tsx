import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { publishDocument } from "@/actions/documents";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";

export default async function NewDocumentPage() {
  await requireInternalUser();
  const [accounts, facilities] = await Promise.all([
    prisma.enterpriseAccount.findMany({ orderBy: { name: "asc" } }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Publish a document" description="Scope it globally, to one tenant, or to one facility." />
      <Card className="max-w-2xl">
        <CardBody>
          <form action={publishDocument} className="space-y-4">
            <Field label="Title" htmlFor="title" required>
              <Input id="title" name="title" required placeholder="e.g. August 2026 SLA & Uptime Report" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Category" htmlFor="category" required>
                <Select id="category" name="category" required defaultValue="Other">
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {DOCUMENT_CATEGORY_LABELS[c] ?? c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tenant (optional)" htmlFor="enterpriseAccountId" hint="Leave blank for all tenants">
                <Select id="enterpriseAccountId" name="enterpriseAccountId" defaultValue="">
                  <option value="">All tenants</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Facility (optional)" htmlFor="facilityId" hint="Leave blank for all sites">
                <Select id="facilityId" name="facilityId" defaultValue="">
                  <option value="">All sites</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="File" htmlFor="file" required>
              <input
                id="file"
                name="file"
                type="file"
                required
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
              />
            </Field>
            <Button type="submit">Publish</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
