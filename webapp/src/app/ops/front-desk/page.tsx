import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { checkInVisitor, checkOutVisitor } from "@/actions/visitors";
import { formatDate } from "@/lib/utils";

export default async function FrontDeskPage({ searchParams }: { searchParams: { q?: string } }) {
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const q = searchParams.q?.trim();

  const visitors = q
    ? await prisma.visitor.findMany({
        where: {
          status: { in: ["Approved", "CheckedIn"] },
          OR: [
            { fullName: { contains: q } },
            { badgeCode: { contains: q } },
            { verificationToken: { contains: q } },
            { company: { contains: q } },
          ],
          ...(scopedFacilityIds ? { visitorRequest: { siteEnrollment: { facilityId: { in: scopedFacilityIds } } } } : {}),
        },
        include: { visitorRequest: { include: { siteEnrollment: { include: { facility: true } } } } },
        take: 20,
      })
    : [];

  const returnPath = `/ops/front-desk?q=${encodeURIComponent(q ?? "")}`;

  return (
    <div>
      <PageHeader
        title="Front Desk"
        description="Look up a visitor's ticket by name, company, or badge/QR code — the badge shown here is what's already registered in the access control system from the approval step."
      />
      <form className="mb-4 flex gap-2" method="get">
        <Input type="text" name="q" defaultValue={q} placeholder="Search name, company, or badge code…" className="max-w-sm" />
        <Button type="submit">Search</Button>
      </form>

      {q && (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Company</TH>
              <TH>Site</TH>
              <TH>Visit date</TH>
              <TH>Badge</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </tr>
          </THead>
          <TBody>
            {visitors.length === 0 && <EmptyRow colSpan={7} message="No approved visitors match that search." />}
            {visitors.map((v) => {
              const checkInBound = checkInVisitor.bind(null, v.id, returnPath);
              const checkOutBound = checkOutVisitor.bind(null, v.id, returnPath);
              return (
                <TR key={v.id}>
                  <TD className="font-medium text-slate-900">{v.fullName}</TD>
                  <TD>{v.company ?? "—"}</TD>
                  <TD>{v.visitorRequest.siteEnrollment.facility.name}</TD>
                  <TD>{formatDate(v.visitorRequest.visitDate)}</TD>
                  <TD>{v.badgeCode ?? "—"}</TD>
                  <TD>
                    <StatusBadge status={v.status} />
                  </TD>
                  <TD>
                    {v.status === "Approved" && (
                      <form action={checkInBound}>
                        <Button type="submit" size="sm">
                          {v.badgeCode ? `Register badge ${v.badgeCode} & check in` : "Check in"}
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
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
