import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantGlobalAdmin } from "@/lib/session";
import { toCsv } from "@/lib/csv";
import { makeSimplePdf } from "@/lib/pdf";
import { formatDate } from "@/lib/utils";
import { REPORT_TYPE_LABELS } from "@/lib/constants";

function parseRange(searchParams: URLSearchParams) {
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export async function GET(req: Request) {
  const user = await requireTenantGlobalAdmin();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const { from, to } = parseRange(searchParams);
  const accountId = user.enterpriseAccountId;

  let headers: string[] = [];
  let rows: (string | number | null)[][] = [];
  let title = REPORT_TYPE_LABELS[type] ?? type;

  if (type === "VisitorActivity") {
    const requests = await prisma.visitorRequest.findMany({
      where: { siteEnrollment: { enterpriseAccountId: accountId }, createdAt: { gte: from, lte: to } },
      include: { visitors: true, siteEnrollment: { include: { facility: true } } },
      orderBy: { createdAt: "desc" },
    });
    headers = ["Purpose", "Site", "Visit date", "Visitors", "Requested"];
    rows = requests.map((r) => [r.purpose, r.siteEnrollment.facility.name, formatDate(r.visitDate), r.visitors.length, formatDate(r.createdAt)]);
  } else if (type === "IncidentSummary") {
    const facilityIds = (
      await prisma.siteEnrollment.findMany({ where: { enterpriseAccountId: accountId }, select: { facilityId: true } })
    ).map((s) => s.facilityId);
    const incidents = await prisma.incident.findMany({
      where: { facilityId: { in: facilityIds }, isCustomerVisible: true, startedAt: { gte: from, lte: to } },
      include: { facility: true },
      orderBy: { startedAt: "desc" },
    });
    headers = ["Title", "Category", "Severity", "Facility", "Status", "Started", "Resolved"];
    rows = incidents.map((i) => [i.title, i.category, i.severity, i.facility.name, i.status, formatDate(i.startedAt), i.resolvedAt ? formatDate(i.resolvedAt) : ""]);
  } else if (type === "ServiceRequestSummary") {
    const requests = await prisma.serviceRequest.findMany({
      where: { siteEnrollment: { enterpriseAccountId: accountId }, createdAt: { gte: from, lte: to } },
      include: { siteEnrollment: { include: { facility: true } }, assignedToUser: true },
      orderBy: { createdAt: "desc" },
    });
    headers = ["Subject", "Category", "Site", "Status", "Assigned to", "Submitted"];
    rows = requests.map((r) => [r.subject, r.category, r.siteEnrollment.facility.name, r.status, r.assignedToUser?.name ?? "Unassigned", formatDate(r.createdAt)]);
  } else if (type === "BillingSummary") {
    const invoices = await prisma.invoice.findMany({
      where: { enterpriseAccountId: accountId, issueDate: { gte: from, lte: to } },
      orderBy: { issueDate: "desc" },
    });
    headers = ["Invoice #", "Status", "Period", "Issue date", "Due date", "Total"];
    rows = invoices.map((i) => [i.invoiceNumber, i.status, `${formatDate(i.periodStart)} – ${formatDate(i.periodEnd)}`, formatDate(i.issueDate), formatDate(i.dueDate), i.total]);
  } else if (type === "MaintenanceSummary") {
    const facilityIds = (
      await prisma.siteEnrollment.findMany({ where: { enterpriseAccountId: accountId }, select: { facilityId: true } })
    ).map((s) => s.facilityId);
    const events = await prisma.maintenanceEvent.findMany({
      where: { facilityId: { in: facilityIds }, startAt: { gte: from, lte: to } },
      include: { facility: true },
      orderBy: { startAt: "desc" },
    });
    headers = ["Title", "Type", "Impact", "Facility", "Status", "Start", "End"];
    rows = events.map((e) => [e.title, e.maintType, e.impact, e.facility.name, e.status, formatDate(e.startAt), formatDate(e.endAt)]);
  } else {
    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }

  if (format === "csv") {
    const csv = toCsv(headers, rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-${from.toISOString().slice(0,10)}-to-${to.toISOString().slice(0,10)}.csv"`,
      },
    });
  }

  const summaryLines = [
    `Range: ${formatDate(from)} – ${formatDate(to)}`,
    `Total records: ${rows.length}`,
    "",
    ...rows.slice(0, 30).map((r) => r.join(" · ")),
    ...(rows.length > 30 ? [`… and ${rows.length - 30} more — see the CSV export for the full list.`] : []),
  ];
  const pdf = makeSimplePdf(title, summaryLines);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${type}-${from.toISOString().slice(0,10)}-to-${to.toISOString().slice(0,10)}.pdf"`,
    },
  });
}
