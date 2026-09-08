import { notFound, redirect } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { deleteDocument, publishFacilityDocument } from "@/actions/documents";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";
import { getFacilityTabAccess } from "@/lib/facility-tabs";
import { ActionForm } from "@/components/errors/action-form";

export default async function FacilityDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const { canViewDocuments } = getFacilityTabAccess(user.role);
  if (!canViewDocuments) redirect(`/ops/admin/facilities/${id}`);

  const facility = await prisma.facility.findUnique({
    where: { id },
    include: { siteEnrollments: { include: { enterpriseAccount: true } } },
  });
  if (!facility) notFound();

  const documents = await prisma.document.findMany({
    where: { OR: [{ facilityId: null }, { facilityId: id }] },
    include: { enterpriseAccount: true, publishedByUser: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });
  const returnPath = `/ops/admin/facilities/${id}/documents`;
  const publishBound = publishFacilityDocument.bind(null, id);
  const enrolledAccounts = facility.siteEnrollments.map((e) => e.enterpriseAccount);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Table>
          <THead>
            <tr>
              <TH>Title</TH>
              <TH>Category</TH>
              <TH>Scope</TH>
              <TH>Published by</TH>
              <TH>Published</TH>
              <TH>Actions</TH>
            </tr>
          </THead>
          <TBody>
            {documents.length === 0 && <EmptyRow colSpan={6} message="No documents published for this site yet." />}
            {documents.map((doc) => {
              const deleteBound = deleteDocument.bind(null, doc.id, returnPath);
              return (
                <TR key={doc.id}>
                  <TD className="font-medium text-slate-900">{doc.title}</TD>
                  <TD>
                    <Badge>{DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}</Badge>
                  </TD>
                  <TD>{doc.enterpriseAccount?.name ?? "All tenants"}</TD>
                  <TD>{doc.publishedByUser.name}</TD>
                  <TD>{formatDate(doc.publishedAt)}</TD>
                  <TD>
                    <div className="flex items-center gap-3">
                      <a href={`/api/documents/${doc.id}`} className="text-sm text-brand hover:underline">
                        Download
                      </a>
                      <ConfirmDeleteButton
                        action={deleteBound}
                        confirmMessage={`Delete "${doc.title}"? This can't be undone.`}
                        label="Delete"
                      />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </div>

      <Card>
        <CardBody>
          <p className="mb-3 text-sm font-medium text-slate-700">Publish for this site</p>
          <ActionForm action={publishBound} className="space-y-3">
            <Field label="Title" htmlFor="docTitle" required>
              <Input id="docTitle" name="title" required />
            </Field>
            <Field label="Category" htmlFor="docCategory" required>
              <Select id="docCategory" name="category" defaultValue={DOCUMENT_CATEGORIES[0]} required>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {DOCUMENT_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tenant (optional)" htmlFor="docAccount" hint="Leave blank to publish to every tenant at this site">
              <Select id="docAccount" name="enterpriseAccountId" defaultValue="">
                <option value="">All tenants at this site</option>
                {enrolledAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="File" htmlFor="docFile" required>
              <input
                id="docFile"
                name="file"
                type="file"
                required
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
              />
            </Field>
            <Button type="submit" className="w-full">
              Publish
            </Button>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
