import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select, Textarea, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ServiceRequestSummary } from "@/components/service-requests/summary";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import {
  assignServiceRequest,
  completeServiceRequest,
  startServiceRequest,
  updateServiceRequestStatus,
} from "@/actions/service-requests";
import { ROLES, SERVICE_REQUEST_STATUSES } from "@/lib/constants";

export default async function OpsServiceRequestDetailPage({ params }: { params: { id: string } }) {
  await requireInternalUser();
  const request = await prisma.serviceRequest.findUnique({
    where: { id: params.id },
    include: {
      siteEnrollment: { include: { facility: true, enterpriseAccount: true } },
      assignedToUser: true,
      createdByUser: true,
    },
  });
  if (!request) notFound();

  const isRemoteHands = request.category === "RemoteHands";
  const staff = await prisma.user.findMany({
    where: {
      role: {
        in: isRemoteHands
          ? [ROLES.PROVIDER_TECHNICIAN, ROLES.PROVIDER_OPS, ROLES.SUPER_ADMIN]
          : [ROLES.PROVIDER_CS, ROLES.PROVIDER_CS_MANAGER, ROLES.PROVIDER_OPS, ROLES.SUPER_ADMIN],
      },
    },
    orderBy: { name: "asc" },
  });

  const returnPath = `/ops/service-requests/${request.id}`;
  const assignBound = assignServiceRequest.bind(null, request.id, returnPath);
  const startBound = startServiceRequest.bind(null, request.id, returnPath);
  const completeBound = completeServiceRequest.bind(null, request.id, returnPath);
  const statusBound = updateServiceRequestStatus.bind(null, request.id, returnPath);

  const isOpen = request.status !== "Done" && request.status !== "Cancelled";

  return (
    <div>
      <PageHeader
        title={request.subject}
        description={`${request.siteEnrollment.enterpriseAccount.name} · ${request.siteEnrollment.facility.name}`}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ServiceRequestSummary request={request} />

          {isRemoteHands && request.status === "Done" && (
            <Card>
              <CardHeader>
                <CardTitle>Customer sign-off</CardTitle>
              </CardHeader>
              <CardBody className="text-sm">
                {request.signOffSignedAt ? (
                  <div className="space-y-1">
                    <p className="text-slate-700">
                      Signed by <span className="font-medium">{request.signOffName}</span> ({request.signOffTitle}) on{" "}
                      {formatDateTime(request.signOffSignedAt)}.
                    </p>
                    <a
                      href={`/api/service-requests/${request.id}/signoff`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline"
                    >
                      View signed acceptance certificate (attach to billing)
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-400">Awaiting the customer&apos;s sign-off.</p>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {request.status === "Submitted" && (
            <Card>
              <CardHeader>
                <CardTitle>Assign</CardTitle>
              </CardHeader>
              <CardBody>
                <form action={assignBound} className="space-y-3">
                  <Field label={isRemoteHands ? "Technician" : "Assign to"} htmlFor="assignedToId" required>
                    <Select id="assignedToId" name="assignedToId" required>
                      <option value="">Choose…</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button type="submit" className="w-full">
                    Accept &amp; assign
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}

          {isRemoteHands && request.status === "Accepted" && (
            <Card>
              <CardHeader>
                <CardTitle>{request.assignedToUser?.name}</CardTitle>
              </CardHeader>
              <CardBody>
                <form action={startBound}>
                  <Button type="submit" className="w-full">
                    Start task
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}

          {isRemoteHands && request.status === "InProgress" && (
            <Card>
              <CardHeader>
                <CardTitle>Complete task</CardTitle>
              </CardHeader>
              <CardBody>
                <form action={completeBound} className="space-y-3">
                  <Field label="Completion notes" htmlFor="completionNotes" required>
                    <Textarea id="completionNotes" name="completionNotes" required placeholder="What was done…" />
                  </Field>
                  <Field label="Completion photo" htmlFor="completionPhoto" hint="Optional proof-of-work photo">
                    <input
                      id="completionPhoto"
                      name="completionPhoto"
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
                    />
                  </Field>
                  <Field
                    label="Billable minutes override"
                    htmlFor="billableMinutesOverride"
                    hint="Leave blank to auto-compute from start/complete timestamps"
                  >
                    <Input id="billableMinutesOverride" name="billableMinutesOverride" type="number" min={1} placeholder="Auto" />
                  </Field>
                  <Button type="submit" className="w-full">
                    Complete task
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}

          {!isRemoteHands && isOpen && request.status !== "Submitted" && (
            <Card>
              <CardHeader>
                <CardTitle>Update status</CardTitle>
              </CardHeader>
              <CardBody>
                <form action={statusBound} className="space-y-3">
                  <Field label="Status" htmlFor="status">
                    <Select id="status" name="status" defaultValue={request.status}>
                      {SERVICE_REQUEST_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button type="submit" className="w-full">
                    Update &amp; notify tenant
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
