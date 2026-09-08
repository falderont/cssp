import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { DocumentsTable } from "@/components/documents/documents-table";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
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
      <DocumentsTable documents={documents} />
    </div>
  );
}
