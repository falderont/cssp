import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceRequestSummary } from "@/components/service-requests/summary";
import { SignOffForm } from "@/components/service-requests/sign-off-form";
import { requireCustomerUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { submitServiceRequestCsat } from "@/actions/service-requests";
import { ActionForm } from "@/components/errors/action-form";

export default async function PortalServiceRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCustomerUser();
  const request = await prisma.serviceRequest.findFirst({
    where: { id, siteEnrollment: { enterpriseAccountId: user.enterpriseAccountId } },
    include: { siteEnrollment: { include: { facility: true } }, assignedToUser: true, createdByUser: true },
  });
  if (!request) notFound();

  const returnPath = `/portal/service-requests/${request.id}`;
  const csatUpBound = submitServiceRequestCsat.bind(null, request.id, "up", returnPath);
  const csatDownBound = submitServiceRequestCsat.bind(null, request.id, "down", returnPath);
  const needsSignOff = request.category === "RemoteHands" && request.status === "Done";

  return (
    <div>
      <PageHeader title={request.subject} description={request.siteEnrollment.facility.name} />
      <div className="space-y-6">
        <ServiceRequestSummary request={request} />

        {needsSignOff && (
          <Card>
            <CardHeader>
              <CardTitle>Customer sign-off</CardTitle>
            </CardHeader>
            <CardBody>
              {request.signOffSignedAt ? (
                <div className="space-y-1 text-sm">
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
                    View / download signed acceptance certificate
                  </a>
                </div>
              ) : (
                <SignOffForm serviceRequestId={request.id} returnPath={returnPath} />
              )}
            </CardBody>
          </Card>
        )}

        {request.status === "Done" && (
          <Card>
            <CardBody>
              <p className="mb-2 text-sm font-medium text-slate-700">How did we do?</p>
              {request.csatRating ? (
                <p className="text-sm text-slate-500">Thanks for your feedback ({request.csatRating === "up" ? "👍" : "👎"}).</p>
              ) : (
                <div className="flex gap-2">
                  <ActionForm action={csatUpBound}>
                    <Button type="submit" size="sm" variant="secondary">
                      👍 Good
                    </Button>
                  </ActionForm>
                  <ActionForm action={csatDownBound}>
                    <Button type="submit" size="sm" variant="secondary">
                      👎 Not great
                    </Button>
                  </ActionForm>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
