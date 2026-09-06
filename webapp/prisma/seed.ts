/**
 * Seeds two provider tenants with realistic demo data across every MVP module.
 * Runs as the `cssp` owner role (DATABASE_URL, not APP_DATABASE_URL) so it
 * bypasses RLS the same way `prisma migrate` does — see prisma/rls.sql and
 * lib/db.ts for why the app itself never connects this way.
 *
 * A second, otherwise-unrelated tenant ("Apex Colocation") exists specifically
 * so prisma/tests/tenant-isolation.test.ts has something real to try to leak.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { MockBmsAdapter } from "../lib/adapters/bms";
import { MockBillingAdapter } from "../lib/adapters/billing";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const STORAGE_ROOT = path.join(process.cwd(), "storage");

/** Writes a placeholder file so seeded Document rows have something real for /api/documents/[id] to serve. */
async function writeDemoFile(fileRef: string, title: string): Promise<number> {
  const resolved = path.join(STORAGE_ROOT, fileRef);
  await mkdir(path.dirname(resolved), { recursive: true });
  const content = `${title}\n\nThis is placeholder content for the CSSP demo dataset — a real document\nwould be published here by provider staff via the Download Center.\n`;
  await writeFile(resolved, content);
  return Buffer.byteLength(content);
}

/** A tiny valid 1x1 PNG so seeded Remote Hands completion photos are a real, renderable image. */
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

async function writeDemoImage(fileRef: string) {
  const resolved = path.join(STORAGE_ROOT, fileRef);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, PLACEHOLDER_PNG);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const bms = new MockBmsAdapter();
const billing = new MockBillingAdapter();

const DEMO_PASSWORD = "demo-pass-1";

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Clearing existing data…");
  // Order matters: children before parents. Skips _prisma_migrations.
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.engagementLog.deleteMany();
  await prisma.remoteHandsTask.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.document.deleteMany();
  await prisma.incidentOrMaintenance.deleteMany();
  await prisma.bmsTelemetryReading.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteEnrollment.deleteMany();
  await prisma.enterpriseAccount.deleteMany();
  await prisma.building.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.region.deleteMany();
  await prisma.integrationConfig.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await hash(DEMO_PASSWORD);

  // ---------------------------------------------------------------------
  // Tenant 1: Meridian Data Centers — the primary demo tenant.
  // ---------------------------------------------------------------------
  const meridianOrg = await prisma.organization.create({
    data: { name: "Meridian Data Centers", tier: "growth" },
  });

  const seaRegion = await prisma.region.create({
    data: { organizationId: meridianOrg.id, name: "Southeast Asia" },
  });
  const usEastRegion = await prisma.region.create({
    data: { organizationId: meridianOrg.id, name: "US East" },
  });

  const jkt01 = await prisma.facility.create({
    data: {
      organizationId: meridianOrg.id,
      regionId: seaRegion.id,
      name: "JKT-01",
      address: "Jl. Sudirman Kav. 45, Jakarta, Indonesia",
      timezone: "Asia/Jakarta",
    },
  });
  const sin02 = await prisma.facility.create({
    data: {
      organizationId: meridianOrg.id,
      regionId: seaRegion.id,
      name: "SIN-02",
      address: "20 Kallang Ave, Singapore",
      timezone: "Asia/Singapore",
    },
  });
  const nyc01 = await prisma.facility.create({
    data: {
      organizationId: meridianOrg.id,
      regionId: usEastRegion.id,
      name: "NYC-01",
      address: "375 Pearl St, New York, NY, USA",
      timezone: "America/New_York",
    },
  });

  const jkt01BuildingA = await prisma.building.create({
    data: { organizationId: meridianOrg.id, facilityId: jkt01.id, name: "Building A" },
  });
  await prisma.building.create({
    data: { organizationId: meridianOrg.id, facilityId: jkt01.id, name: "Building B" },
  });
  await prisma.building.create({
    data: { organizationId: meridianOrg.id, facilityId: sin02.id, name: "Building A" },
  });
  await prisma.building.create({
    data: { organizationId: meridianOrg.id, facilityId: nyc01.id, name: "Building A" },
  });

  const meridianLogistics = await prisma.enterpriseAccount.create({
    data: { organizationId: meridianOrg.id, name: "Meridian Logistics" },
  });
  const northwindFreight = await prisma.enterpriseAccount.create({
    data: { organizationId: meridianOrg.id, name: "Northwind Freight" },
  });

  const mlAtJkt = await prisma.siteEnrollment.create({
    data: { organizationId: meridianOrg.id, enterpriseAccountId: meridianLogistics.id, facilityId: jkt01.id },
  });
  const mlAtSin = await prisma.siteEnrollment.create({
    data: { organizationId: meridianOrg.id, enterpriseAccountId: meridianLogistics.id, facilityId: sin02.id },
  });
  const nwAtNyc = await prisma.siteEnrollment.create({
    data: { organizationId: meridianOrg.id, enterpriseAccountId: northwindFreight.id, facilityId: nyc01.id },
  });

  // Provider staff
  const [providerAdmin, ops, , cs, csManager, technician] = await Promise.all([
    prisma.user.create({
      data: { organizationId: meridianOrg.id, name: "Dara Admin", email: "admin@meridian-dc.example.com", passwordHash, role: "PROVIDER_ADMIN" },
    }),
    prisma.user.create({
      data: { organizationId: meridianOrg.id, name: "Oscar Ops", email: "ops@meridian-dc.example.com", passwordHash, role: "PROVIDER_OPS" },
    }),
    prisma.user.create({
      data: { organizationId: meridianOrg.id, name: "Sam Security", email: "security@meridian-dc.example.com", passwordHash, role: "PROVIDER_SECURITY" },
    }),
    prisma.user.create({
      data: { organizationId: meridianOrg.id, name: "Casey CS", email: "cs@meridian-dc.example.com", passwordHash, role: "PROVIDER_CS" },
    }),
    prisma.user.create({
      data: { organizationId: meridianOrg.id, name: "Morgan Manager", email: "cs.manager@meridian-dc.example.com", passwordHash, role: "PROVIDER_CS_MANAGER" },
    }),
    prisma.user.create({
      data: { organizationId: meridianOrg.id, name: "Toni Technician", email: "tech@meridian-dc.example.com", passwordHash, role: "PROVIDER_TECHNICIAN" },
    }),
  ]);

  // Customer users
  const alexGlobalAdmin = await prisma.user.create({
    data: {
      organizationId: meridianOrg.id,
      enterpriseAccountId: meridianLogistics.id,
      name: "Alex Rahman",
      email: "meridian.admin@example.com",
      passwordHash,
      role: "CUSTOMER_GLOBAL",
    },
  });
  const jamieSiteContact = await prisma.user.create({
    data: {
      organizationId: meridianOrg.id,
      enterpriseAccountId: meridianLogistics.id,
      siteEnrollmentId: mlAtJkt.id,
      name: "Jamie Tanoto",
      email: "jkt.contact@meridian-logistics.example.com",
      passwordHash,
      role: "CUSTOMER_SITE",
    },
  });
  const noraNorthwind = await prisma.user.create({
    data: {
      organizationId: meridianOrg.id,
      enterpriseAccountId: northwindFreight.id,
      name: "Nora Chen",
      email: "northwind.admin@example.com",
      passwordHash,
      role: "CUSTOMER_GLOBAL",
    },
  });

  // Visitors
  const now = new Date();
  const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
  await prisma.visitor.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: mlAtJkt.id,
      buildingId: jkt01BuildingA.id,
      visitorName: "Rina Wijaya",
      visitorCompany: "Acme Networking",
      hostUserId: jamieSiteContact.id,
      visitStart: days(1),
      visitEnd: days(1),
      status: "PENDING",
    },
  });
  await prisma.visitor.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: mlAtJkt.id,
      buildingId: jkt01BuildingA.id,
      visitorName: "Budi Santoso",
      visitorCompany: "Meridian Logistics",
      hostUserId: alexGlobalAdmin.id,
      visitStart: days(6),
      visitEnd: days(6),
      status: "APPROVED",
      accessCredentialRef: "MOCK-CRED-DEMO0001",
    },
  });
  await prisma.visitor.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: mlAtSin.id,
      visitorName: "Wei Chen",
      visitorCompany: "Meridian Logistics",
      hostUserId: alexGlobalAdmin.id,
      visitStart: days(-10),
      visitEnd: days(-10),
      status: "CHECKED_OUT",
      accessCredentialRef: "MOCK-CRED-DEMO0002",
    },
  });

  // Incidents & Maintenance
  await prisma.incidentOrMaintenance.create({
    data: {
      organizationId: meridianOrg.id,
      facilityId: jkt01.id,
      type: "MAINTENANCE",
      status: "SCHEDULED",
      title: "Quarterly generator load test",
      description: "Routine load-bank testing of the standby generator fleet. No customer impact expected.",
      startAt: days(9),
      endAt: days(9),
    },
  });
  await prisma.incidentOrMaintenance.create({
    data: {
      organizationId: meridianOrg.id,
      facilityId: jkt01.id,
      type: "INCIDENT",
      status: "RESOLVED",
      title: "Brief PDU-2 breaker trip",
      description: "PDU-2B breaker tripped and was reset within 4 minutes. Affected racks briefly failed over to redundant feed as designed.",
      startAt: days(-14),
      endAt: days(-14),
    },
  });
  await prisma.incidentOrMaintenance.create({
    data: {
      organizationId: meridianOrg.id,
      facilityId: sin02.id,
      type: "MAINTENANCE",
      status: "IN_PROGRESS",
      title: "Chiller firmware upgrade",
      description: "Rolling firmware upgrade across the chiller plant, one unit at a time, N+1 maintained throughout.",
      startAt: days(-1),
      endAt: days(2),
    },
  });
  await prisma.incidentOrMaintenance.create({
    data: {
      organizationId: meridianOrg.id,
      facilityId: nyc01.id,
      type: "INCIDENT",
      status: "MONITORING",
      title: "Elevated ambient temperature — Building A",
      description: "CRAC unit 3 flagged elevated return air temperature. Ops is monitoring; no threshold breach yet.",
      startAt: days(-1),
    },
  });

  // Documents
  const soc2Size = await writeDemoFile("demo/soc2-type-ii-2026.txt", "2026 SOC 2 Type II Report");
  await prisma.document.create({
    data: {
      organizationId: meridianOrg.id,
      enterpriseAccountId: meridianLogistics.id,
      title: "2026 SOC 2 Type II Report",
      category: "COMPLIANCE_CERTIFICATE",
      fileRef: "demo/soc2-type-ii-2026.txt",
      fileName: "soc2-type-ii-2026.txt",
      fileSize: soc2Size,
      publishedByUserId: providerAdmin.id,
    },
  });
  const slaSize = await writeDemoFile("demo/jkt01-q2-sla-report.txt", "JKT-01 Q2 SLA Report");
  await prisma.document.create({
    data: {
      organizationId: meridianOrg.id,
      enterpriseAccountId: meridianLogistics.id,
      facilityId: jkt01.id,
      title: "JKT-01 Q2 SLA Report",
      category: "SLA_REPORT",
      fileRef: "demo/jkt01-q2-sla-report.txt",
      fileName: "jkt01-q2-sla-report.txt",
      fileSize: slaSize,
      publishedByUserId: cs.id,
    },
  });
  const runbookSize = await writeDemoFile("demo/nyc01-power-failover-runbook.txt", "NYC-01 Runbook — Power Failover");
  await prisma.document.create({
    data: {
      organizationId: meridianOrg.id,
      enterpriseAccountId: northwindFreight.id,
      facilityId: nyc01.id,
      title: "NYC-01 Runbook — Power Failover",
      category: "RUNBOOK",
      fileRef: "demo/nyc01-power-failover-runbook.txt",
      fileName: "nyc01-power-failover-runbook.txt",
      fileSize: runbookSize,
      publishedByUserId: ops.id,
    },
  });

  // Tickets
  await prisma.ticket.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: mlAtJkt.id,
      category: "SERVICE_REQUEST",
      subject: "Add additional IP allocation",
      description: "We need a /29 allocated for a new deployment in rack B12.",
      status: "OPEN",
      createdByUserId: jamieSiteContact.id,
    },
  });
  const resolvedComplaint = await prisma.ticket.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: mlAtJkt.id,
      category: "COMPLAINT",
      subject: "Delayed response on badge access request",
      description: "Our last badge access request took over 48 hours to process — that's outside what we'd expect.",
      status: "RESOLVED",
      createdByUserId: alexGlobalAdmin.id,
      assignedToUserId: cs.id,
      resolvedAt: days(-3),
      csatRating: 4,
    },
  });
  await prisma.ticket.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: mlAtSin.id,
      category: "RFI",
      subject: "Cross-connect pricing to carrier X",
      description: "Can you share current pricing and lead time for a cross-connect to Carrier X's cage?",
      status: "IN_PROGRESS",
      createdByUserId: alexGlobalAdmin.id,
      assignedToUserId: cs.id,
    },
  });
  await prisma.ticket.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: nwAtNyc.id,
      category: "SERVICE_REQUEST",
      subject: "Request additional power circuit",
      description: "Planning a capacity expansion in Q3 — need a second 30A circuit in our suite.",
      status: "WAITING_ON_CUSTOMER",
      createdByUserId: noraNorthwind.id,
      assignedToUserId: csManager.id,
    },
  });

  // Remote / Smart Hands
  await writeDemoImage("demo/remote-hands-b12-u22-complete.png");
  const completedTask = await prisma.remoteHandsTask.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: mlAtJkt.id,
      taskType: "POWER_CYCLE",
      assetOrRackRef: "Rack B12, U22",
      description: "Server is unresponsive to remote management — please power cycle.",
      status: "COMPLETED",
      createdByUserId: jamieSiteContact.id,
      assignedTechnicianId: technician.id,
      startedAt: days(-2),
      completedAt: days(-2),
      billableMinutes: 25,
      completionNotes: "Power cycled the device in rack B12, U22. Confirmed it came back online and responded to ping within 3 minutes.",
      completionPhotoRef: "demo/remote-hands-b12-u22-complete.png",
      csatRating: 5,
    },
  });
  await prisma.remoteHandsTask.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: mlAtJkt.id,
      taskType: "VISUAL_INSPECTION",
      assetOrRackRef: "Rack A04",
      description: "Please check for any loose cabling or visible damage — we saw intermittent link flaps overnight.",
      status: "IN_PROGRESS",
      createdByUserId: alexGlobalAdmin.id,
      assignedTechnicianId: technician.id,
      startedAt: days(0),
    },
  });
  await prisma.remoteHandsTask.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: mlAtSin.id,
      taskType: "CABLE_PATCH",
      assetOrRackRef: "Rack C09",
      description: "Patch our new switch's port 12 to the carrier demarc per the diagram we emailed.",
      status: "ACCEPTED",
      createdByUserId: alexGlobalAdmin.id,
      assignedTechnicianId: technician.id,
    },
  });
  await prisma.remoteHandsTask.create({
    data: {
      organizationId: meridianOrg.id,
      siteEnrollmentId: nwAtNyc.id,
      taskType: "KVM_ACCESS",
      assetOrRackRef: "Rack N02",
      description: "Need temporary KVM access to our management server — OS won't boot past the BIOS screen.",
      status: "SUBMITTED",
      createdByUserId: noraNorthwind.id,
      requestedWindowStart: days(1),
      requestedWindowEnd: days(1),
    },
  });

  // CS Engagement & Performance (internal only)
  await prisma.engagementLog.create({
    data: {
      organizationId: meridianOrg.id,
      enterpriseAccountId: meridianLogistics.id,
      loggedByUserId: cs.id,
      type: "CALL",
      notes: "Quarterly check-in call — discussed upcoming capacity needs for Q3 and the IP allocation request.",
      occurredAt: days(-7),
    },
  });
  await prisma.engagementLog.create({
    data: {
      organizationId: meridianOrg.id,
      enterpriseAccountId: meridianLogistics.id,
      siteEnrollmentId: mlAtJkt.id,
      loggedByUserId: cs.id,
      type: "TICKET",
      notes: "Resolved badge access complaint; apologized for the delay and tightened our SLA on access requests.",
      occurredAt: days(-3),
      linkedTicketId: resolvedComplaint.id,
    },
  });
  await prisma.engagementLog.create({
    data: {
      organizationId: meridianOrg.id,
      enterpriseAccountId: meridianLogistics.id,
      siteEnrollmentId: mlAtJkt.id,
      loggedByUserId: cs.id,
      type: "REMOTE_HANDS",
      notes: "Remote hands task auto-logged: Power Cycle completed for Rack B12, U22.",
      occurredAt: days(-2),
      linkedRemoteHandsTaskId: completedTask.id,
    },
  });
  await prisma.engagementLog.create({
    data: {
      organizationId: meridianOrg.id,
      enterpriseAccountId: northwindFreight.id,
      loggedByUserId: csManager.id,
      type: "EMAIL",
      notes: "Sent a proactive heads-up about the NYC-01 elevated ambient temperature incident before they noticed it themselves.",
      occurredAt: days(-1),
    },
  });

  // Billing / Invoices — read-only surface over a mock external billing system.
  for (const [account, recurringCents] of [
    [meridianLogistics, 850_000],
    [northwindFreight, 320_000],
  ] as const) {
    for (const monthsAgo of [2, 1, 0]) {
      const draft = billing.generateMonthlyInvoice(monthsAgo, recurringCents);
      const total = draft.lineItems.reduce((sum, li) => sum + li.unitAmount * li.quantity, 0);
      const invoice = await prisma.invoice.create({
        data: {
          organizationId: meridianOrg.id,
          enterpriseAccountId: account.id,
          periodStart: draft.periodStart,
          periodEnd: draft.periodEnd,
          status: draft.status,
          totalAmount: total,
          currency: draft.currency,
          issuedAt: draft.issuedAt,
          dueAt: draft.dueAt,
          externalRef: draft.externalRef,
        },
      });
      for (const li of draft.lineItems) {
        await prisma.invoiceLineItem.create({
          data: {
            organizationId: meridianOrg.id,
            invoiceId: invoice.id,
            description: li.description,
            category: li.category,
            quantity: li.quantity,
            unitAmount: li.unitAmount,
            amount: li.unitAmount * li.quantity,
          },
        });
      }
    }
  }
  // Fold the completed Remote Hands task's billable time into last month's Meridian Logistics invoice.
  const lastMonthInvoice = await prisma.invoice.findFirst({
    where: { enterpriseAccountId: meridianLogistics.id, status: "ISSUED" },
    orderBy: { periodStart: "desc" },
  });
  if (lastMonthInvoice) {
    const remoteHandsAmount = Math.round((completedTask.billableMinutes! / 60) * 15_000); // $150/hr
    await prisma.invoiceLineItem.create({
      data: {
        organizationId: meridianOrg.id,
        invoiceId: lastMonthInvoice.id,
        description: "Remote Hands — Power Cycle (Rack B12, U22)",
        category: "REMOTE_HANDS",
        quantity: 1,
        unitAmount: remoteHandsAmount,
        amount: remoteHandsAmount,
        linkedRemoteHandsTaskId: completedTask.id,
      },
    });
    await prisma.invoice.update({
      where: { id: lastMonthInvoice.id },
      data: { totalAmount: { increment: remoteHandsAmount } },
    });
  }

  // BMS Telemetry (optional/stretch) — 24h of hourly readings for two facilities.
  for (const facility of [jkt01, nyc01]) {
    const readings = bms.generateReadings(facility.id, null, 24);
    await prisma.bmsTelemetryReading.createMany({
      data: readings.map((r) => ({
        organizationId: meridianOrg.id,
        facilityId: r.facilityId,
        buildingId: r.buildingId ?? null,
        metric: r.metric,
        value: r.value,
        unit: r.unit,
        recordedAt: r.recordedAt,
      })),
    });
  }

  // Integration configs — every adapter kind starts in MOCK mode for a fresh tenant.
  for (const kind of ["ACCESS_CONTROL", "DCIM", "CMMS", "BMS", "BILLING"] as const) {
    await prisma.integrationConfig.create({
      data: { organizationId: meridianOrg.id, kind, mode: "MOCK" },
    });
  }

  // ---------------------------------------------------------------------
  // Tenant 2: Apex Colocation — exists to prove tenant isolation, not to demo.
  // ---------------------------------------------------------------------
  const apexOrg = await prisma.organization.create({ data: { name: "Apex Colocation", tier: "starter" } });
  const usWestRegion = await prisma.region.create({ data: { organizationId: apexOrg.id, name: "US West" } });
  const sfo01 = await prisma.facility.create({
    data: { organizationId: apexOrg.id, regionId: usWestRegion.id, name: "SFO-01", address: "1 Market St, San Francisco, CA, USA" },
  });
  await prisma.building.create({ data: { organizationId: apexOrg.id, facilityId: sfo01.id, name: "Building A" } });
  const vertexSystems = await prisma.enterpriseAccount.create({ data: { organizationId: apexOrg.id, name: "Vertex Systems" } });
  const vertexAtSfo = await prisma.siteEnrollment.create({
    data: { organizationId: apexOrg.id, enterpriseAccountId: vertexSystems.id, facilityId: sfo01.id },
  });
  const apexAdmin = await prisma.user.create({
    data: { organizationId: apexOrg.id, name: "Priya Kapoor", email: "apex.admin@apex-colo.example.com", passwordHash, role: "PROVIDER_ADMIN" },
  });
  const vertexAdmin = await prisma.user.create({
    data: {
      organizationId: apexOrg.id,
      enterpriseAccountId: vertexSystems.id,
      name: "Victor Marsh",
      email: "vertex.admin@example.com",
      passwordHash,
      role: "CUSTOMER_GLOBAL",
    },
  });
  await prisma.visitor.create({
    data: {
      organizationId: apexOrg.id,
      siteEnrollmentId: vertexAtSfo.id,
      visitorName: "Test Visitor (Apex)",
      hostUserId: vertexAdmin.id,
      visitStart: days(3),
      visitEnd: days(3),
      status: "PENDING",
    },
  });
  await prisma.ticket.create({
    data: {
      organizationId: apexOrg.id,
      siteEnrollmentId: vertexAtSfo.id,
      category: "SERVICE_REQUEST",
      subject: "Vertex-only ticket — should never appear under Meridian",
      description: "This row exists purely so prisma/tests/tenant-isolation.test.ts has something to try to leak.",
      status: "OPEN",
      createdByUserId: vertexAdmin.id,
    },
  });
  for (const kind of ["ACCESS_CONTROL", "DCIM", "CMMS", "BMS", "BILLING"] as const) {
    await prisma.integrationConfig.create({ data: { organizationId: apexOrg.id, kind, mode: "MOCK" } });
  }

  console.log("Seed complete.");
  console.log(`  Meridian Data Centers: ${meridianOrg.id}`);
  console.log(`  Apex Colocation:       ${apexOrg.id}`);
  console.log(`  All seeded users share the password: ${DEMO_PASSWORD}`);
  console.log(`  Provider admin (Meridian): ${providerAdmin.email}`);
  console.log(`  Customer global admin (Meridian Logistics): ${alexGlobalAdmin.email}`);
  console.log(`  Provider admin (Apex): ${apexAdmin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
