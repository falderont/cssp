import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerFacilityIds, documentVisibilityWhere } from "@/lib/scope";
import { formatDate } from "@/lib/utils";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";

export default async function PortalDocumentsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const user = await requireCustomerUser();
  const facilityIds = await getCustomerFacilityIds(user);
  const documents = await prisma.document.findMany({
    where: {
      ...documentVisibilityWhere(user.enterpriseAccountId, facilityIds),
      ...(category ? { category } : {}),
    },
    include: { facility: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Download Center" description="SLA reports, invoices, compliance certificates and contracts, all in one place." />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <a
          href="/portal/documents"
          className={`rounded-full px-3 py-1 text-xs font-medium ${!category ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}
        >
          All
        </a>
        {DOCUMENT_CATEGORIES.map((c) => (
          <a
            key={c}
            href={`/portal/documents?category=${c}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${category === c ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {DOCUMENT_CATEGORY_LABELS[c] ?? c}
          </a>
        ))}
      </form>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {documents.length === 0 && (
          <Card>
            <CardBody className="text-center text-sm text-slate-400">No documents in this category yet.</CardBody>
          </Card>
        )}
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardBody>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">{doc.title}</p>
                    <p className="text-xs text-slate-500">
                      {doc.facility ? doc.facility.name : "All sites"} · {formatDate(doc.publishedAt)} · {doc.fileSizeKb} KB
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge>{DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}</Badge>
                <a
                  href={`/api/documents/${doc.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
