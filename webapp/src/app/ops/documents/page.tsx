import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { formatDate } from "@/lib/utils";
import { deleteDocument } from "@/actions/documents";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { getFacilityTabAccess } from "@/lib/facility-tabs";

// Documents now also live on each site's own management page — a viewer
// pinned to one facility goes straight there, but only if their role can
// reach the facility page's Documents tab at all: CS Team can also be
// facility-restricted and has no site tab, so it keeps this cross-site page.
export default async function OpsDocumentsPage() {
  const user = await requireInternalUser();
  if (user.restrictedFacilityId && getFacilityTabAccess(user.role).canViewDocuments) {
    redirect(`/ops/admin/facilities/${user.restrictedFacilityId}/documents`);
  }
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const documents = await prisma.document.findMany({
    where: scopedFacilityIds ? { OR: [{ facilityId: null }, { facilityId: { in: scopedFacilityIds } }] } : undefined,
    include: { enterpriseAccount: true, facility: true, publishedByUser: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Download Center"
        description="Publish reports, invoices, certificates and contracts — scoped globally, to one tenant, or to one facility."
        actions={
          <LinkButton href="/ops/documents/new">
            <Plus className="h-4 w-4" /> Publish document
          </LinkButton>
        }
      />
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
          {documents.length === 0 && <EmptyRow colSpan={6} message="No documents published yet." />}
          {documents.map((doc) => {
            const deleteBound = deleteDocument.bind(null, doc.id, "/ops/documents");
            return (
              <TR key={doc.id}>
                <TD className="font-medium text-slate-900">{doc.title}</TD>
                <TD>
                  <Badge>{DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}</Badge>
                </TD>
                <TD>
                  {doc.enterpriseAccount?.name ?? "All tenants"}
                  {doc.facility ? ` · ${doc.facility.name}` : ""}
                </TD>
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
  );
}
