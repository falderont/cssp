import { FileDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTenantGlobalAdmin } from "@/lib/session";
import { REPORT_TYPES, REPORT_TYPE_LABELS } from "@/lib/constants";

const today = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

export default async function PortalReportsPage() {
  await requireTenantGlobalAdmin();

  return (
    <div>
      <PageHeader title="Reports" description="Generate and export reports across your visitors, incidents, service requests, billing and maintenance." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORT_TYPES.map((type) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle>{REPORT_TYPE_LABELS[type]}</CardTitle>
            </CardHeader>
            <CardBody>
              <form className="flex flex-wrap items-end gap-2" method="get" action="/api/reports" target="_blank">
                <input type="hidden" name="type" value={type} />
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
                  <input
                    type="date"
                    name="from"
                    defaultValue={thirtyDaysAgo()}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
                  <input type="date" name="to" defaultValue={today()} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <button
                  type="submit"
                  name="format"
                  value="csv"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  <FileDown className="h-4 w-4" /> CSV
                </button>
                <button
                  type="submit"
                  name="format"
                  value="pdf"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
                >
                  <FileDown className="h-4 w-4" /> PDF summary
                </button>
              </form>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
