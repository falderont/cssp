import { redirect } from "next/navigation";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { requireFacilityPageAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { markDeliveryArrived, markDeliveryReceived, rejectDelivery, uploadDeliveryPhoto } from "@/actions/deliveries";
import { getFacilityTabAccess } from "@/lib/facility-tabs";
import { ActionForm } from "@/components/errors/action-form";

export default async function FacilityDeliveriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireFacilityPageAccess();
  const { canViewFrontLine } = getFacilityTabAccess(user.role);
  if (!canViewFrontLine) redirect(`/ops/admin/facilities/${id}`);

  const deliveries = await prisma.delivery.findMany({
    where: { facilityId: id },
    include: { enterpriseAccount: true, receivedBy: true, loadingDock: { include: { building: true } }, photos: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
  const returnPath = `/ops/admin/facilities/${id}/front-line/deliveries`;

  return (
    <Table>
      <THead>
        <tr>
          <TH>Courier</TH>
          <TH>Description</TH>
          <TH>Dock</TH>
          <TH>Tenant</TH>
          <TH>Status</TH>
          <TH>Actions</TH>
          <TH>Arrival evidence</TH>
        </tr>
      </THead>
      <TBody>
        {deliveries.length === 0 && <EmptyRow colSpan={7} message="No delivery tickets submitted yet." />}
        {deliveries.map((d) => {
          const arrivedBound = markDeliveryArrived.bind(null, d.id, returnPath);
          const receivedBound = markDeliveryReceived.bind(null, d.id, returnPath);
          const rejectBound = rejectDelivery.bind(null, d.id, returnPath);
          const uploadPhotoBound = uploadDeliveryPhoto.bind(null, d.id, returnPath);
          const canUploadEvidence = d.status === "Arrived" || d.status === "Received";
          return (
            <TR key={d.id}>
              <TD className="font-medium text-slate-900">
                {d.courierName}
                {d.trackingNumber && <p className="text-xs text-slate-400">{d.trackingNumber}</p>}
              </TD>
              <TD className="max-w-xs truncate">{d.description}</TD>
              <TD>
                {d.loadingDock ? (
                  <>
                    {d.loadingDock.building ? `${d.loadingDock.building.name}: ` : ""}
                    {d.loadingDock.name}
                  </>
                ) : (
                  "—"
                )}
              </TD>
              <TD>{d.enterpriseAccount.name}</TD>
              <TD>
                <StatusBadge status={d.status} />
                <p className="mt-0.5 text-xs text-slate-400">
                  {d.status === "Received" && d.receivedAt
                    ? `Received ${formatDateTime(d.receivedAt)}${d.receivedBy ? ` by ${d.receivedBy.name}` : ""}`
                    : d.arrivedAt
                      ? `Arrived ${formatDateTime(d.arrivedAt)}`
                      : d.expectedAt
                        ? `Expected ${formatDate(d.expectedAt)}`
                        : ""}
                </p>
              </TD>
              <TD>
                {(d.status === "Expected" || d.status === "Arrived") && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {d.status === "Expected" && (
                      <ActionForm action={arrivedBound}>
                        <Button type="submit" size="sm" variant="secondary">
                          Mark arrived
                        </Button>
                      </ActionForm>
                    )}
                    <ActionForm action={receivedBound}>
                      <Button type="submit" size="sm" variant="secondary">
                        Mark received
                      </Button>
                    </ActionForm>
                    <ActionForm action={rejectBound}>
                      <Button type="submit" size="sm" variant="danger">
                        Reject
                      </Button>
                    </ActionForm>
                  </div>
                )}
              </TD>
              <TD>
                {canUploadEvidence ? (
                  <div className="space-y-2">
                    {d.photos.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {d.photos.map((photo) => (
                          <a key={photo.id} href={`/api/deliveries/photos/${photo.id}`} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/deliveries/photos/${photo.id}`}
                              alt="Delivery arrival evidence"
                              className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    <ActionForm action={uploadPhotoBound} className="flex items-center gap-1.5">
                      <input
                        type="file"
                        name="photo"
                        accept="image/*"
                        required
                        className="w-40 text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-brand/10 file:px-2 file:py-1 file:text-xs file:font-medium file:text-brand hover:file:bg-brand/20"
                      />
                      <Button type="submit" size="sm" variant="secondary">
                        Upload
                      </Button>
                    </ActionForm>
                  </div>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
