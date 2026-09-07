import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { requireInternalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getOpsFacilityIds } from "@/lib/scope";
import { checkInVisitor, checkOutVisitor } from "@/actions/visitors";
import { formatDate } from "@/lib/utils";
import { ActionForm } from "@/components/errors/action-form";

export default async function FrontDeskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const searchParamsResolved = await searchParams;
  const user = await requireInternalUser();
  const scopedFacilityIds = await getOpsFacilityIds(user);
  const q = searchParamsResolved.q?.trim();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const upcoming = await prisma.visitor.findMany({
    where: {
      status: { in: ["Approved", "CheckedIn"] },
      visitorRequest: {
        visitDate: { gte: startOfToday },
        ...(scopedFacilityIds ? { siteEnrollment: { facilityId: { in: scopedFacilityIds } } } : {}),
      },
    },
    include: {
      visitorRequest: {
        include: { siteEnrollment: { include: { facility: true } }, building: true, hostUser: true },
      },
    },
    take: 100,
  });
  upcoming.sort((a, b) => {
    const dateDiff = a.visitorRequest.visitDate.getTime() - b.visitorRequest.visitDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.visitorRequest.windowStart.localeCompare(b.visitorRequest.windowStart);
  });

  const searchResults = q
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

  const returnPath = `/ops/front-desk${q ? `?q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <PageHeader
        title="Front Desk"
        description="Today's and upcoming approved reservations, plus lookup by name, company, or badge/QR code — badges shown here are already registered in the access control system from the approval step."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upcoming reservations</CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <tr>
              <TH>Visit date</TH>
              <TH>Window</TH>
              <TH>Visitor</TH>
              <TH>Company</TH>
              <TH>Host</TH>
              <TH>Site</TH>
              <TH>Badge</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </tr>
          </THead>
          <TBody>
            {upcoming.length === 0 && <EmptyRow colSpan={9} message="No approved visitors scheduled from today onward." />}
            {upcoming.map((v) => {
              const checkInBound = checkInVisitor.bind(null, v.id, returnPath);
              const checkOutBound = checkOutVisitor.bind(null, v.id, returnPath);
              return (
                <TR key={v.id}>
                  <TD>{formatDate(v.visitorRequest.visitDate)}</TD>
                  <TD>
                    {v.visitorRequest.windowStart}–{v.visitorRequest.windowEnd}
                  </TD>
                  <TD>
                    <Link href={`/ops/front-desk/${v.visitorRequest.id}`} className="font-medium text-brand hover:underline">
                      {v.fullName}
                    </Link>
                  </TD>
                  <TD>{v.company ?? "—"}</TD>
                  <TD>{v.visitorRequest.hostUser?.name ?? "—"}</TD>
                  <TD>
                    {v.visitorRequest.siteEnrollment.facility.name}
                    {v.visitorRequest.building ? ` · ${v.visitorRequest.building.name}` : ""}
                  </TD>
                  <TD>{v.badgeCode ?? "—"}</TD>
                  <TD>
                    <StatusBadge status={v.status} />
                  </TD>
                  <TD>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {v.status === "Approved" && (
                        <ActionForm action={checkInBound}>
                          <Button type="submit" size="sm">
                            {v.badgeCode ? `Register badge ${v.badgeCode} & check in` : "Check in"}
                          </Button>
                        </ActionForm>
                      )}
                      {v.status === "CheckedIn" && (
                        <ActionForm action={checkOutBound}>
                          <Button type="submit" size="sm" variant="secondary">
                            Check out
                          </Button>
                        </ActionForm>
                      )}
                      <LinkButton href={`/ops/front-desk/${v.visitorRequest.id}`} variant="secondary" size="sm">
                        View ticket
                      </LinkButton>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Look up a visitor</CardTitle>
        </CardHeader>
        <CardBody className="border-b border-slate-100">
          <form className="flex gap-2" method="get">
            <Input type="text" name="q" defaultValue={q} placeholder="Search name, company, or badge code…" className="max-w-sm" />
            <Button type="submit">Search</Button>
          </form>
        </CardBody>

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
              {searchResults.length === 0 && <EmptyRow colSpan={7} message="No approved visitors match that search." />}
              {searchResults.map((v) => {
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        {v.status === "Approved" && (
                          <ActionForm action={checkInBound}>
                            <Button type="submit" size="sm">
                              {v.badgeCode ? `Register badge ${v.badgeCode} & check in` : "Check in"}
                            </Button>
                          </ActionForm>
                        )}
                        {v.status === "CheckedIn" && (
                          <ActionForm action={checkOutBound}>
                            <Button type="submit" size="sm" variant="secondary">
                              Check out
                            </Button>
                          </ActionForm>
                        )}
                        <Link
                          href={`/ops/front-desk/${v.visitorRequest.id}`}
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          View ticket
                        </Link>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
