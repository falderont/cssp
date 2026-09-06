import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { canPublishDocuments } from "@/lib/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { PublishDocumentForm } from "./publish-form";
import { format } from "date-fns";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ConsoleDocumentsPage() {
  const session = await requireSession();
  const canPublish = canPublishDocuments(session.role);

  const { documents, accounts, facilities } = await withTenant(session.organizationId, async (tx) => {
    const documents = await tx.document.findMany({
      include: { enterpriseAccount: true, facility: true, publishedBy: true },
      orderBy: { publishedAt: "desc" },
    });
    const accounts = await tx.enterpriseAccount.findMany({ orderBy: { name: "asc" } });
    const facilities = await tx.facility.findMany({ orderBy: { name: "asc" } });
    return { documents, accounts, facilities };
  });

  return (
    <div>
      <PageHeader title="Download Center" description="Publish documents to an enterprise account, at the site or account level." />

      {canPublish && (
        <Card className="mb-8 p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900">Publish a document</h2>
          <PublishDocumentForm
            accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
            facilities={facilities.map((f) => ({ id: f.id, name: f.name }))}
          />
        </Card>
      )}

      {documents.length === 0 ? (
        <EmptyState title="No documents published yet" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Account / Site</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Published</th>
                  <th className="px-5 py-3 font-medium">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-3 font-medium text-ink-900">{d.title}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {d.enterpriseAccount.name}
                      {d.facility ? <span className="text-slate-400"> · {d.facility.name}</span> : <span className="text-slate-400"> · All sites</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{d.category.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {format(d.publishedAt, "MMM d, yyyy")} · {d.publishedBy.name}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{formatSize(d.fileSize)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
