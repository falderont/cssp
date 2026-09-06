import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireBlacklistManager } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { createBlacklistEntry, deleteBlacklistEntry } from "@/actions/blacklist";

export default async function BlacklistPage() {
  await requireBlacklistManager();
  const entries = await prisma.blacklistEntry.findMany({ include: { createdBy: true }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader
        title="Visitor blacklist"
        description="Checked automatically against every incoming visitor — by name or ID number — before it reaches the ops approval queue."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>ID number</TH>
                <TH>Company</TH>
                <TH>Reason</TH>
                <TH>Added by</TH>
                <TH>Actions</TH>
              </tr>
            </THead>
            <TBody>
              {entries.length === 0 && <EmptyRow colSpan={6} message="No blacklist entries yet." />}
              {entries.map((e) => {
                const deleteBound = deleteBlacklistEntry.bind(null, e.id);
                return (
                  <TR key={e.id}>
                    <TD className="font-medium text-slate-900">{e.fullName}</TD>
                    <TD>{e.idNumber ?? "—"}</TD>
                    <TD>{e.company ?? "—"}</TD>
                    <TD className="max-w-xs truncate">{e.reason}</TD>
                    <TD>
                      {e.createdBy.name}
                      <p className="text-xs text-slate-400">{formatDate(e.createdAt)}</p>
                    </TD>
                    <TD>
                      <form action={deleteBound}>
                        <Button type="submit" size="sm" variant="ghost">
                          Remove
                        </Button>
                      </form>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-slate-700">Add entry</p>
            <form action={createBlacklistEntry} className="space-y-3">
              <Field label="Full name" htmlFor="fullName" required>
                <Input id="fullName" name="fullName" required />
              </Field>
              <Field label="ID number (optional)" htmlFor="idNumber">
                <Input id="idNumber" name="idNumber" />
              </Field>
              <Field label="Company (optional)" htmlFor="company">
                <Input id="company" name="company" />
              </Field>
              <Field label="Reason" htmlFor="reason" required>
                <Textarea id="reason" name="reason" required placeholder="Why is this person/entity blacklisted?" />
              </Field>
              <Button type="submit" className="w-full">
                Add to blacklist
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
