import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { postIncidentUpdate, toggleIncidentVisibility, uploadIncidentReport } from "@/actions/incidents";
import { INCIDENT_STATUSES, parseImpactedServices } from "@/lib/constants";
import { ActionForm } from "@/components/errors/action-form";

export default async function OpsIncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireInternalUser();
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: { facility: true, building: true, updates: { orderBy: { createdAt: "asc" }, include: { createdByUser: true } } },
  });
  if (!incident) notFound();

  const returnPath = `/ops/incidents/${incident.id}`;
  const postUpdateBound = postIncidentUpdate.bind(null, incident.id, returnPath);
  const toggleVisibilityBound = toggleIncidentVisibility.bind(null, incident.id, returnPath);
  const uploadReportBound = uploadIncidentReport.bind(null, incident.id, returnPath);
  const impactedServices = parseImpactedServices(incident.impactedServices);

  return (
    <div>
      <PageHeader title={incident.title} description={`${incident.facility.name}${incident.building ? " · " + incident.building.name : ""}`} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge tone={incident.severity === "P1" || incident.severity === "P2" ? "red" : "amber"}>{incident.severity}</Badge>
                <Badge tone="slate">{incident.category}</Badge>
                <StatusBadge status={incident.status} />
              </div>
              <span className="text-xs text-slate-400">Started {formatDateTime(incident.startedAt)}</span>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-slate-700">{incident.description}</p>
              {incident.locationDetail && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Location:</span> {incident.locationDetail}
                </p>
              )}
              {impactedServices.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {impactedServices.map((s) => (
                    <Badge key={s} tone="blue">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              {incident.updates.length === 0 ? (
                <p className="text-sm text-slate-400">No updates posted yet.</p>
              ) : (
                <ol className="space-y-4 border-l border-slate-200 pl-4">
                  {incident.updates.map((u) => (
                    <li key={u.id}>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(u.createdAt)} · {u.createdByUser.name}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-700">{u.message}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post an update</CardTitle>
            </CardHeader>
            <CardBody>
              <ActionForm action={postUpdateBound} className="space-y-3">
                <Field label="Update status" htmlFor="status">
                  <Select id="status" name="status" defaultValue={incident.status}>
                    {INCIDENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Message" htmlFor="message" required>
                  <Textarea id="message" name="message" required placeholder="What's changed since the last update?" />
                </Field>
                <Button type="submit" className="w-full">
                  Post update
                </Button>
              </ActionForm>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Tenant visibility</p>
                <p className="text-xs text-slate-500">{incident.isCustomerVisible ? "Visible to tenants" : "Internal only"}</p>
              </div>
              <ActionForm action={toggleVisibilityBound} silent>
                <Button type="submit" size="sm" variant="secondary">
                  {incident.isCustomerVisible ? "Hide from tenants" : "Publish to tenants"}
                </Button>
              </ActionForm>
            </CardBody>
          </Card>

          {incident.status === "Resolved" && (
            <Card>
              <CardHeader>
                <CardTitle>Incident report</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {incident.reportStorageKey ? (
                  <a
                    href={`/api/incidents/${incident.id}/report`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-brand hover:underline"
                  >
                    Download {incident.reportFileName}
                  </a>
                ) : (
                  <ActionForm action={uploadReportBound} className="space-y-3">
                    <Field label="Upload report (from DCIM)" htmlFor="report" required>
                      <input
                        id="report"
                        name="report"
                        type="file"
                        required
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
                      />
                    </Field>
                    <Button type="submit" className="w-full" variant="secondary">
                      Attach to closure
                    </Button>
                  </ActionForm>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
