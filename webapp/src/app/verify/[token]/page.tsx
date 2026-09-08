import { notFound } from "next/navigation";
import { Building2, ShieldCheck, ShieldQuestion } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getProviderBranding } from "@/lib/branding";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

// Public, unauthenticated by design — this is the page a guard-house or
// front-office scan of the visitor's QR pass resolves to, ahead of badge
// registration. No internal IDs, notes, or blacklist details are exposed
// here regardless of status.
export default async function VerifyVisitorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const visitor = await prisma.visitor.findUnique({
    where: { verificationToken: token },
    include: {
      visitorRequest: {
        include: { siteEnrollment: { include: { facility: true } }, building: true, hostUser: true },
      },
    },
  });
  if (!visitor) notFound();

  const branding = await getProviderBranding();
  const vr = visitor.visitorRequest;
  const isActive = ["Approved", "CheckedIn", "CheckedOut"].includes(visitor.status);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand" />
          <span className="font-display text-sm font-semibold text-slate-900">{branding.companyName}</span>
        </div>

        {isActive ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <ShieldCheck className="h-4 w-4 shrink-0" /> Visitor pass — please verify against photo ID
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <ShieldQuestion className="h-4 w-4 shrink-0" /> This pass is not active — direct this visitor to the front desk
          </div>
        )}

        <div className="space-y-3 text-sm">
          <Row label="Name" value={visitor.fullName} />
          <Row label="Company" value={visitor.company ?? "—"} />
          {isActive && (
            <>
              <Row label="Site" value={vr.siteEnrollment.facility.name} />
              {vr.building && <Row label="Building" value={vr.building.name} />}
              <Row label="Purpose" value={vr.purpose} />
              <Row label="Visit date" value={formatDate(vr.visitDate)} />
              <Row label="Window" value={`${vr.windowStart}–${vr.windowEnd}`} />
              {vr.hostUser && <Row label="Host" value={vr.hostUser.name} />}
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-400">{visitor.badgeCode ? `Badge ${visitor.badgeCode}` : "No badge issued"}</span>
          <StatusBadge status={visitor.status} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
