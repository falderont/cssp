import { requireSession } from "@/lib/auth/dal";
import { withTenant } from "@/lib/tenant";
import { resolvePortalScope } from "@/lib/portal-scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import clsx from "clsx";
import type { DocumentCategory } from "@/lib/generated/prisma/client";

const CATEGORIES: DocumentCategory[] = ["SLA_REPORT", "COMPLIANCE_CERTIFICATE", "INVOICE_BACKUP", "RUNBOOK", "OTHER"];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function PortalDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; category?: string }>;
}) {
  const session = await requireSession();
  const { site, category } = await searchParams;

  const documents = await withTenant(session.organizationId, async (tx) => {
    const scope = await resolvePortalScope(tx, session, site);
    return tx.document.findMany({
      where: {
        enterpriseAccountId: session.enterpriseAccountId!,
        OR: [{ facilityId: null }, { facilityId: { in: scope.facilityIds } }],
        ...(category && (CATEGORIES as string[]).includes(category) ? { category: category as DocumentCategory } : {}),
      },
      include: { facility: true },
      orderBy: { publishedAt: "desc" },
    });
  });

  return (
    <div>
      <PageHeader title="Download Center" description="Reports and documents your provider has published for your account." />

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/portal/documents"
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium",
            !category ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          )}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/portal/documents?category=${c}`}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-medium",
              category === c ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {c.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      {documents.length === 0 ? (
        <EmptyState title="No documents here yet" description="Reports and certificates your provider publishes will show up here." />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-ink-900">{d.title}</p>
                  <p className="text-xs text-slate-400">
                    {d.category.replace(/_/g, " ")} · {d.facility ? d.facility.name : "All sites"} ·{" "}
                    {format(d.publishedAt, "MMM d, yyyy")} · {formatSize(d.fileSize)}
                  </p>
                </div>
                <a
                  href={`/api/documents/${d.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
