import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Select, Textarea, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { ResolvedBarChart } from "@/components/cs-performance/resolved-bar-chart";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTeamPerformance } from "@/lib/cs-performance";
import { logEngagement } from "@/actions/engagement";
import { ENGAGEMENT_TYPES, ROLE_LABELS, ROLES, type Role } from "@/lib/constants";
import { formatDate, humanize } from "@/lib/utils";
import { ActionForm } from "@/components/errors/action-form";

export default async function CsPerformancePage() {
  const user = await requireInternalUser();
  const isManager = user.role === ROLES.SYS_ADMIN || (user.role === ROLES.CS_TEAM && user.csScope === "Corporate") || user.role === ROLES.OPS_SITE_MANAGER;

  const [accounts, myLogs] = await Promise.all([
    prisma.enterpriseAccount.findMany({ orderBy: { name: "asc" } }),
    prisma.engagementLog.findMany({
      where: { repId: user.id },
      include: { enterpriseAccount: true },
      orderBy: { occurredAt: "desc" },
      take: 20,
    }),
  ]);

  const team = isManager ? await getTeamPerformance() : [];
  const chartData = team.map((t) => ({ name: t.name.split(" ")[0], resolved: t.resolvedCount }));

  return (
    <div>
      <PageHeader title="CS Engagement & Performance" description="Internal only — log touchpoints and track team performance." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Log a touchpoint</CardTitle>
            </CardHeader>
            <CardBody>
              <ActionForm action={logEngagement} className="space-y-3">
                <Field label="Account" htmlFor="enterpriseAccountId" required>
                  <Select id="enterpriseAccountId" name="enterpriseAccountId" required>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Type" htmlFor="type" required>
                  <Select id="type" name="type" required defaultValue="call">
                    {ENGAGEMENT_TYPES.filter((t) => t === "call" || t === "email" || t === "meeting" || t === "site_visit").map((t) => (
                      <option key={t} value={t}>
                        {humanize(t)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date" htmlFor="occurredAt">
                  <Input id="occurredAt" name="occurredAt" type="date" />
                </Field>
                <Field label="Notes" htmlFor="notes" required>
                  <Textarea id="notes" name="notes" required placeholder="What did you discuss?" />
                </Field>
                <Button type="submit" className="w-full">
                  Log touchpoint
                </Button>
              </ActionForm>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My engagement</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <THead>
                  <tr>
                    <TH>Account</TH>
                    <TH>Type</TH>
                    <TH>Notes</TH>
                    <TH>Date</TH>
                  </tr>
                </THead>
                <TBody>
                  {myLogs.length === 0 && <EmptyRow colSpan={4} message="No touchpoints logged yet." />}
                  {myLogs.map((log) => (
                    <TR key={log.id}>
                      <TD>{log.enterpriseAccount.name}</TD>
                      <TD>
                        <Badge>{humanize(log.type)}</Badge>
                      </TD>
                      <TD className="max-w-sm truncate">{log.notes}</TD>
                      <TD>{formatDate(log.occurredAt)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardBody>
          </Card>

          {isManager && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Resolved items per rep</CardTitle>
                </CardHeader>
                <CardBody>
                  <ResolvedBarChart data={chartData} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Team performance</CardTitle>
                </CardHeader>
                <CardBody className="p-0">
                  <Table>
                    <THead>
                      <tr>
                        <TH>Rep</TH>
                        <TH>Role</TH>
                        <TH>Resolved</TH>
                        <TH>Avg resolution time</TH>
                        <TH>Touchpoints</TH>
                        <TH>Avg CSAT</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {team.map((t) => (
                        <TR key={t.userId}>
                          <TD className="font-medium text-slate-900">{t.name}</TD>
                          <TD>{ROLE_LABELS[t.role as Role] ?? t.role}</TD>
                          <TD>{t.resolvedCount}</TD>
                          <TD>{t.avgResolutionHrs != null ? `${t.avgResolutionHrs.toFixed(1)} hrs` : "—"}</TD>
                          <TD>{t.touchpoints}</TD>
                          <TD>{t.avgCsat != null ? `${t.avgCsat.toFixed(1)} / 5` : "—"}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
