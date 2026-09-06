import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/utils";
import { generateQrDataUrl } from "@/lib/qr";
import {
  approveAllVisitors,
  approveVisitor,
  checkInVisitor,
  checkOutVisitor,
  denyVisitor,
  overrideApproveBlacklistedVisitor,
  retrySyncAcs,
} from "@/actions/visitors";
import type { AcsIntegrationLog, Building, Facility, SiteEnrollment, User, Visitor, VisitorRequest } from "@prisma/client";

type FullVisitorRequest = VisitorRequest & {
  visitors: Visitor[];
  acsLogs: AcsIntegrationLog[];
  building: Building | null;
  hostUser: User | null;
  createdByUser: User;
  siteEnrollment: SiteEnrollment & { facility: Facility };
};

const QR_ELIGIBLE_STATUSES = ["Approved", "CheckedIn", "CheckedOut"];

export async function VisitorRequestDetailView({
  visitorRequest,
  mode,
  returnPath,
}: {
  visitorRequest: FullVisitorRequest;
  mode: "portal" | "ops";
  returnPath: string;
}) {
  const vr = visitorRequest;
  const approveAllBound = approveAllVisitors.bind(null, vr.id, returnPath);
  const retrySyncBound = retrySyncAcs.bind(null, vr.id, returnPath);
  const hasPending = vr.visitors.some((v) => v.status === "Pending");
  const hasBlacklisted = vr.visitors.some((v) => v.status === "Blacklisted");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const visitorRows = await Promise.all(
    vr.visitors.map(async (v) => ({
      v,
      qrDataUrl: QR_ELIGIBLE_STATUSES.includes(v.status) ? await generateQrDataUrl(`${baseUrl}/verify/${v.verificationToken}`) : null,
    }))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{vr.purpose}</CardTitle>
          <StatusBadge status={vr.acsSyncStatus} />
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Site" value={vr.siteEnrollment.facility.name} />
          <Info label="Building" value={vr.building?.name ?? "—"} />
          <Info label="Visit date" value={formatDate(vr.visitDate)} />
          <Info label="Window" value={`${vr.windowStart}–${vr.windowEnd}`} />
          <Info label="Host" value={vr.hostUser?.name ?? "—"} />
          <Info label="Source" value={vr.source} />
          <Info label="Requested by" value={vr.createdByUser.name} />
          <Info label="Requested on" value={formatDate(vr.createdAt)} />
        </CardBody>
      </Card>

      {hasBlacklisted && (
        <Card className="border-red-200 bg-red-50/40">
          <CardBody className="text-sm text-red-800">
            One or more visitors on this request matched the blacklist and are held pending{" "}
            {mode === "ops" ? "your override" : "review by the operations team"}.
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Visitors ({vr.visitors.length})</CardTitle>
          {mode === "ops" && hasPending && (
            <form action={approveAllBound}>
              <Button type="submit" size="sm">
                Approve all &amp; sync to ACS
              </Button>
            </form>
          )}
        </CardHeader>
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Company</TH>
              <TH>ID</TH>
              <TH>Badge</TH>
              <TH>QR pass</TH>
              <TH>Status</TH>
              {mode === "ops" && <TH>Actions</TH>}
            </tr>
          </THead>
          <TBody>
            {visitorRows.map(({ v, qrDataUrl }) => {
              const approveBound = approveVisitor.bind(null, v.id, returnPath);
              const denyBound = denyVisitor.bind(null, v.id, returnPath);
              const checkInBound = checkInVisitor.bind(null, v.id, returnPath);
              const checkOutBound = checkOutVisitor.bind(null, v.id, returnPath);
              const overrideBound = overrideApproveBlacklistedVisitor.bind(null, v.id, returnPath);
              return (
                <TR key={v.id}>
                  <TD className="font-medium text-slate-900">{v.fullName}</TD>
                  <TD>{v.company ?? "—"}</TD>
                  <TD>{v.idType || v.idNumber ? `${v.idType ?? ""} ${v.idNumber ?? ""}`.trim() : "—"}</TD>
                  <TD>{v.badgeCode ?? "—"}</TD>
                  <TD>
                    {qrDataUrl ? (
                      <Link href={`/verify/${v.verificationToken}`} target="_blank">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrDataUrl} alt="Verification QR code" className="h-12 w-12 rounded border border-slate-200" />
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD>
                    <StatusBadge status={v.status} />
                    {mode === "ops" && v.blacklistReason && (
                      <p
                        className={`mt-0.5 max-w-[16rem] text-xs ${
                          v.status === "Blacklisted" ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {v.blacklistReason}
                      </p>
                    )}
                    {v.checkedInAt && <p className="mt-0.5 text-xs text-slate-400">In: {formatDateTime(v.checkedInAt)}</p>}
                    {v.checkedOutAt && <p className="text-xs text-slate-400">Out: {formatDateTime(v.checkedOutAt)}</p>}
                  </TD>
                  {mode === "ops" && (
                    <TD>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {v.status === "Pending" && (
                          <>
                            <form action={approveBound}>
                              <Button type="submit" size="sm" variant="secondary">
                                Approve
                              </Button>
                            </form>
                            <form action={denyBound}>
                              <Button type="submit" size="sm" variant="danger">
                                Deny
                              </Button>
                            </form>
                          </>
                        )}
                        {v.status === "Blacklisted" && (
                          <>
                            <form action={overrideBound} className="flex flex-wrap items-center gap-1.5">
                              <input
                                type="text"
                                name="overrideReason"
                                required
                                placeholder="Override justification"
                                className="w-40 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                              />
                              <Button type="submit" size="sm" variant="secondary">
                                Override &amp; approve
                              </Button>
                            </form>
                            <form action={denyBound}>
                              <Button type="submit" size="sm" variant="danger">
                                Deny
                              </Button>
                            </form>
                          </>
                        )}
                        {v.status === "Approved" && (
                          <form action={checkInBound}>
                            <Button type="submit" size="sm" variant="secondary">
                              Check in
                            </Button>
                          </form>
                        )}
                        {v.status === "CheckedIn" && (
                          <form action={checkOutBound}>
                            <Button type="submit" size="sm" variant="secondary">
                              Check out
                            </Button>
                          </form>
                        )}
                      </div>
                    </TD>
                  )}
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Access control integration log</CardTitle>
          {mode === "ops" && (
            <form action={retrySyncBound}>
              <Button type="submit" size="sm" variant="secondary">
                Retry sync
              </Button>
            </form>
          )}
        </CardHeader>
        <CardBody>
          {vr.acsLogs.length === 0 ? (
            <p className="text-sm text-slate-400">
              Not synced yet — approve a visitor to push a badge-provisioning request to the campus access control
              system.
            </p>
          ) : (
            <ul className="space-y-3">
              {[...vr.acsLogs].reverse().map((log) => (
                <li key={log.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{formatDateTime(log.createdAt)}</span>
                    <StatusBadge status={log.responseStatus >= 200 && log.responseStatus < 300 ? "Approved" : "Denied"} />
                  </div>
                  <p className="mt-1 truncate text-slate-600">
                    POST {log.endpointUrl} → HTTP {log.responseStatus || "n/a"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}
