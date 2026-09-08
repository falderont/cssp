import { FileDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
                  <Input type="date" name="from" defaultValue={thirtyDaysAgo()} className="w-auto" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
                  <Input type="date" name="to" defaultValue={today()} className="w-auto" />
                </div>
                <Button type="submit" name="format" value="csv" variant="secondary">
                  <FileDown className="h-4 w-4" /> CSV
                </Button>
                <Button type="submit" name="format" value="pdf">
                  <FileDown className="h-4 w-4" /> PDF summary
                </Button>
              </form>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
