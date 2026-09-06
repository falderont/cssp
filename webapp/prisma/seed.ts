import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

const STORAGE_ROOT = path.join(process.cwd(), "storage");
const PUBLIC_ROOT = path.join(process.cwd(), "public");
const NOW = new Date();
const DEFAULT_PASSWORD = "password123";

function daysFromNow(n: number): Date {
  return new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);
}
function hoursFromNow(n: number): Date {
  return new Date(NOW.getTime() + n * 60 * 60 * 1000);
}

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

// --- Minimal, dependency-free PDF generator for seeded demo documents ------

function escapePdfText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function makeSimplePdf(title: string, lines: string[]): Buffer {
  const allLines = [title, "", ...lines];
  const streamParts: string[] = ["BT", "/F1 16 Tf", "50 760 Td"];
  allLines.forEach((line, i) => {
    if (i === 1) streamParts.push("/F1 11 Tf");
    if (i > 0) streamParts.push("0 -20 Td");
    streamParts.push(`(${escapePdfText(line)}) Tj`);
  });
  streamParts.push("ET");
  const stream = streamParts.join("\n");

  const bufferParts: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [];

  function addObj(index: number, body: string) {
    offsets[index] = Buffer.byteLength(bufferParts.join(""), "latin1");
    bufferParts.push(`${index} 0 obj\n${body}\nendobj\n`);
  }

  addObj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObj(
    3,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
  );
  addObj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObj(5, `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);

  const xrefOffset = Buffer.byteLength(bufferParts.join(""), "latin1");
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  bufferParts.push(xref);
  bufferParts.push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(bufferParts.join(""), "latin1");
}

// A 1x1 white pixel — just enough to be a valid, renderable JPEG for demo
// "completion photo" records without shipping a binary asset in the repo.
const TINY_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

async function saveDocumentPdf(subpath: string, title: string, lines: string[]) {
  const full = path.join(STORAGE_ROOT, "documents", subpath);
  await mkdir(path.dirname(full), { recursive: true });
  const pdf = makeSimplePdf(title, lines);
  await writeFile(full, pdf);
  return { storageKey: `documents/${subpath}`, fileSizeKb: Math.max(1, Math.round(pdf.byteLength / 1024)) };
}

async function saveCompletionPhoto(subpath: string) {
  const full = path.join(STORAGE_ROOT, "photos", subpath);
  await mkdir(path.dirname(full), { recursive: true });
  const buf = Buffer.from(TINY_JPEG_BASE64, "base64");
  await writeFile(full, buf);
  return `photos/${subpath}`;
}

async function saveLogo() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#2563eb"/>
  <path d="M32 12 L50 46 H40.5 L32 29 L23.5 46 H14 Z" fill="white"/>
</svg>`;
  const full = path.join(PUBLIC_ROOT, "branding", "logo.svg");
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, svg);
  return "/branding/logo.svg";
}

// --- Telemetry generation ----------------------------------------------------

function generateTelemetrySeries(facilityId: string, hours: number) {
  const points: { facilityId: string; metric: string; value: number; recordedAt: Date }[] = [];
  for (let h = hours; h >= 0; h--) {
    const t = hoursFromNow(-h);
    const wave = Math.sin((h / 24) * Math.PI * 2);
    points.push({ facilityId, metric: "TEMP_C", value: Number((22.5 + wave * 0.8 + (Math.random() - 0.5) * 0.4).toFixed(1)), recordedAt: t });
    points.push({
      facilityId,
      metric: "HUMIDITY_PCT",
      value: Number((50 + wave * 3 + (Math.random() - 0.5) * 2).toFixed(1)),
      recordedAt: t,
    });
    points.push({
      facilityId,
      metric: "POWER_KW",
      value: Number((950 + wave * 60 + (Math.random() - 0.5) * 30).toFixed(1)),
      recordedAt: t,
    });
    points.push({ facilityId, metric: "PUE", value: Number((1.48 + wave * 0.05 + (Math.random() - 0.5) * 0.03).toFixed(2)), recordedAt: t });
  }
  return points;
}

async function main() {
  console.log("Clearing existing data…");
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.engagementLog.deleteMany(),
    prisma.invoiceLineItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.document.deleteMany(),
    prisma.remoteHandsTask.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.maintenanceNotification.deleteMany(),
    prisma.maintenanceEvent.deleteMany(),
    prisma.incidentUpdate.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.acsIntegrationLog.deleteMany(),
    prisma.visitor.deleteMany(),
    prisma.visitorRequest.deleteMany(),
    prisma.telemetryPoint.deleteMany(),
    prisma.telemetrySource.deleteMany(),
    prisma.siteEnrollment.deleteMany(),
    prisma.user.deleteMany(),
    prisma.enterpriseAccount.deleteMany(),
    prisma.building.deleteMany(),
    prisma.facility.deleteMany(),
    prisma.region.deleteMany(),
    prisma.providerSettings.deleteMany(),
  ]);

  console.log("Branding…");
  const logoUrl = await saveLogo();
  await prisma.providerSettings.create({
    data: {
      id: "singleton",
      companyName: "Aurora PDC",
      logoUrl,
      primaryColor: "#2563eb",
      secondaryColor: "#0f172a",
      supportEmail: "support@aurorapdc.com",
      supportPhone: "+62 21 5000 1234",
      address: "Jl. Data Center Raya No. 1, Jakarta, Indonesia",
    },
  });

  console.log("Regions & facilities…");
  const regionID = await prisma.region.create({ data: { name: "Indonesia", code: "ID" } });
  const regionSG = await prisma.region.create({ data: { name: "Singapore", code: "SG" } });

  const btm02 = await prisma.facility.create({
    data: { name: "BTM-02 — Batam", code: "BTM-02", regionId: regionID.id, timezone: "Asia/Jakarta", address: "Batam Free Trade Zone, Batam, Indonesia" },
  });
  const jkt01 = await prisma.facility.create({
    data: { name: "JKT-01 — Jakarta", code: "JKT-01", regionId: regionID.id, timezone: "Asia/Jakarta", address: "Kawasan Industri Cibitung, Jakarta, Indonesia" },
  });
  const sby01 = await prisma.facility.create({
    data: { name: "SBY-01 — Surabaya", code: "SBY-01", regionId: regionID.id, timezone: "Asia/Jakarta", address: "Jl. Rungkut Industri, Surabaya, Indonesia" },
  });
  const sgp01 = await prisma.facility.create({
    data: { name: "SGP-01 — Singapore", code: "SGP-01", regionId: regionSG.id, timezone: "Asia/Singapore", address: "Tai Seng, Singapore" },
  });

  const [btm02A, btm02B] = await Promise.all([
    prisma.building.create({ data: { facilityId: btm02.id, name: "Building A", code: "A" } }),
    prisma.building.create({ data: { facilityId: btm02.id, name: "Building B", code: "B" } }),
  ]);
  const [jkt01A, jkt01B] = await Promise.all([
    prisma.building.create({ data: { facilityId: jkt01.id, name: "Building A", code: "A" } }),
    prisma.building.create({ data: { facilityId: jkt01.id, name: "Building B", code: "B" } }),
  ]);
  const sby01A = await prisma.building.create({ data: { facilityId: sby01.id, name: "Main Hall", code: "MH" } });
  await prisma.building.create({ data: { facilityId: sgp01.id, name: "Main Hall", code: "MH" } });

  console.log("Telemetry…");
  await prisma.telemetrySource.create({ data: { facilityId: btm02.id, vendor: "Schneider EcoStruxure", status: "Connected", lastSyncAt: NOW } });
  await prisma.telemetrySource.create({ data: { facilityId: jkt01.id, vendor: "Generic BACnet Gateway", status: "Connected", lastSyncAt: NOW } });
  await prisma.telemetrySource.create({ data: { facilityId: sby01.id, status: "NotConfigured" } });
  await prisma.telemetrySource.create({ data: { facilityId: sgp01.id, status: "NotConfigured" } });
  await prisma.telemetryPoint.createMany({ data: generateTelemetrySeries(btm02.id, 48) });
  await prisma.telemetryPoint.createMany({ data: generateTelemetrySeries(jkt01.id, 48) });

  console.log("Tenant accounts…");
  const meridian = await prisma.enterpriseAccount.create({
    data: { name: "Meridian Logistics", legalName: "PT Meridian Logistik Indonesia", tier: "Enterprise", billingEmail: "billing@meridianlogistics.com" },
  });
  const nusantara = await prisma.enterpriseAccount.create({
    data: { name: "Nusantara Cloud", legalName: "PT Nusantara Cloud Sejahtera", tier: "Premium", billingEmail: "billing@nusantaracloud.io" },
  });
  const trisula = await prisma.enterpriseAccount.create({
    data: { name: "Trisula Fintech", legalName: "PT Trisula Fintech Indonesia", tier: "Standard", billingEmail: "finance@trisulafintech.com" },
  });
  const horizon = await prisma.enterpriseAccount.create({
    data: { name: "Horizon Retail Group", legalName: "Horizon Retail Group Pte Ltd", tier: "Standard", billingEmail: "ap@horizonretail.sg" },
  });

  console.log("Site enrollments…");
  const enrMeridianBtm = await prisma.siteEnrollment.create({ data: { enterpriseAccountId: meridian.id, facilityId: btm02.id, spaceRef: "Cage 7, Racks C10–C20" } });
  const enrMeridianJkt = await prisma.siteEnrollment.create({ data: { enterpriseAccountId: meridian.id, facilityId: jkt01.id, spaceRef: "Suite 4B" } });
  const enrNusantaraJkt = await prisma.siteEnrollment.create({ data: { enterpriseAccountId: nusantara.id, facilityId: jkt01.id, spaceRef: "Rack B08" } });
  const enrNusantaraSby = await prisma.siteEnrollment.create({ data: { enterpriseAccountId: nusantara.id, facilityId: sby01.id, spaceRef: "Racks A02–A04" } });
  const enrTrisulaSby = await prisma.siteEnrollment.create({ data: { enterpriseAccountId: trisula.id, facilityId: sby01.id, spaceRef: "Rack D11" } });
  const enrHorizonSgp = await prisma.siteEnrollment.create({ data: { enterpriseAccountId: horizon.id, facilityId: sgp01.id, spaceRef: "Suite 2" } });

  console.log("Users…");
  const pw = await hash(DEFAULT_PASSWORD);
  const admin = await prisma.user.create({ data: { name: "Andra Wicaksono", email: "admin@aurorapdc.com", passwordHash: pw, role: "SUPER_ADMIN", title: "Platform Administrator" } });
  const noc = await prisma.user.create({ data: { name: "Agus Firmansyah", email: "noc@aurorapdc.com", passwordHash: pw, role: "PROVIDER_OPS", title: "NOC Engineer" } });
  const security = await prisma.user.create({ data: { name: "Dewi Lestari", email: "security@aurorapdc.com", passwordHash: pw, role: "PROVIDER_SECURITY", title: "Security Lead" } });
  const csManager = await prisma.user.create({ data: { name: "Made Wirawan", email: "csmanager@aurorapdc.com", passwordHash: pw, role: "PROVIDER_CS_MANAGER", title: "CS Manager" } });
  const csRep = await prisma.user.create({ data: { name: "Rina Setiawan", email: "cs.rina@aurorapdc.com", passwordHash: pw, role: "PROVIDER_CS", title: "Customer Success Rep" } });
  const csRep2 = await prisma.user.create({ data: { name: "Agus Firmansyah II", email: "cs.agus@aurorapdc.com", passwordHash: pw, role: "PROVIDER_CS", title: "Customer Success Rep" } });
  const tech = await prisma.user.create({ data: { name: "Yoga Pratama", email: "tech@aurorapdc.com", passwordHash: pw, role: "PROVIDER_TECHNICIAN", title: "Field Technician" } });
  const tech2 = await prisma.user.create({ data: { name: "Wayan Suryadi", email: "tech2@aurorapdc.com", passwordHash: pw, role: "PROVIDER_TECHNICIAN", title: "Field Technician" } });
  const finance = await prisma.user.create({ data: { name: "Budi Santoso", email: "finance@aurorapdc.com", passwordHash: pw, role: "PROVIDER_FINANCE", title: "Billing Manager" } });

  const ditaAyu = await prisma.user.create({
    data: { name: "Dita Ayu", email: "dita.ayu@meridianlogistics.com", passwordHash: pw, role: "CUSTOMER_ADMIN", title: "IT Infrastructure Manager", enterpriseAccountId: meridian.id },
  });
  const fajar = await prisma.user.create({
    data: { name: "Fajar Nugroho", email: "fajar.nugroho@meridianlogistics.com", passwordHash: pw, role: "CUSTOMER_USER", title: "Site Contact — BTM-02", enterpriseAccountId: meridian.id, restrictedFacilityId: btm02.id },
  });
  const rinaSaputri = await prisma.user.create({
    data: { name: "Rina Saputri", email: "rina.saputri@nusantaracloud.io", passwordHash: pw, role: "CUSTOMER_USER", title: "Site Contact — JKT-01", enterpriseAccountId: nusantara.id, restrictedFacilityId: jkt01.id },
  });
  const sitiRahayu = await prisma.user.create({
    data: { name: "Siti Rahayu", email: "siti.rahayu@nusantaracloud.io", passwordHash: pw, role: "CUSTOMER_ADMIN", title: "Head of Infrastructure", enterpriseAccountId: nusantara.id },
  });
  const hendra = await prisma.user.create({
    data: { name: "Hendra Kusuma", email: "hendra.kusuma@trisulafintech.com", passwordHash: pw, role: "CUSTOMER_ADMIN", title: "IT Manager", enterpriseAccountId: trisula.id },
  });
  const michelle = await prisma.user.create({
    data: { name: "Michelle Tan", email: "michelle.tan@horizonretail.sg", passwordHash: pw, role: "CUSTOMER_ADMIN", title: "Regional IT Director", enterpriseAccountId: horizon.id },
  });

  console.log("Visitors…");
  const vr1 = await prisma.visitorRequest.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      buildingId: btm02A.id,
      purpose: "Cross-connect installation",
      visitDate: daysFromNow(-2),
      windowStart: "10:00",
      windowEnd: "11:00",
      isGroup: false,
      source: "Single",
      hostUserId: ditaAyu.id,
      createdById: ditaAyu.id,
      acsSyncStatus: "Synced",
      visitors: { create: [{ fullName: "Andi Prasetyo", idType: "KTP", idNumber: "3201xxxxxxxxxx01", company: "PT Kabel Nusantara", status: "CheckedOut", badgeCode: "ACS-BTM-9021", checkedInAt: daysFromNow(-2), checkedOutAt: daysFromNow(-2) }] },
    },
  });
  await prisma.acsIntegrationLog.create({
    data: { visitorRequestId: vr1.id, endpointUrl: "http://localhost:3000/api/integrations/acs/mock", requestPayload: JSON.stringify({ facilityCode: "BTM-02", visitors: 1 }), responseStatus: 200, responseBody: JSON.stringify({ status: "GRANTED" }) },
  });

  const vr2 = await prisma.visitorRequest.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      buildingId: btm02A.id,
      purpose: "Quarterly cabling audit — contractor crew",
      visitDate: daysFromNow(3),
      windowStart: "09:00",
      windowEnd: "12:00",
      isGroup: true,
      source: "Batch",
      hostUserId: fajar.id,
      createdById: fajar.id,
      acsSyncStatus: "NotSynced",
      visitors: {
        create: [
          { fullName: "Rudi Hartono", company: "Cabling Contractor Indonesia", status: "Pending" },
          { fullName: "Bayu Setiadi", company: "Cabling Contractor Indonesia", status: "Pending" },
          { fullName: "Eko Prabowo", company: "Cabling Contractor Indonesia", status: "Pending" },
        ],
      },
    },
  });
  void vr2;

  const vr3 = await prisma.visitorRequest.create({
    data: {
      siteEnrollmentId: enrNusantaraJkt.id,
      purpose: "Rack audit",
      visitDate: daysFromNow(1),
      windowStart: "13:00",
      windowEnd: "14:00",
      isGroup: false,
      source: "Single",
      hostUserId: rinaSaputri.id,
      createdById: rinaSaputri.id,
      visitors: { create: [{ fullName: "Budi Santoso", company: "Nusantara Cloud", status: "Approved", badgeCode: "ACS-JKT-4471" }] },
    },
  });
  await prisma.acsIntegrationLog.create({
    data: { visitorRequestId: vr3.id, endpointUrl: "http://localhost:3000/api/integrations/acs/mock", requestPayload: JSON.stringify({ facilityCode: "JKT-01", visitors: 1 }), responseStatus: 200, responseBody: JSON.stringify({ status: "GRANTED" }) },
  });
  await prisma.visitorRequest.update({ where: { id: vr3.id }, data: { acsSyncStatus: "Synced" } });

  await prisma.visitorRequest.create({
    data: {
      siteEnrollmentId: enrTrisulaSby.id,
      purpose: "Vendor hardware upgrade",
      visitDate: daysFromNow(5),
      windowStart: "14:00",
      windowEnd: "16:00",
      isGroup: false,
      source: "Single",
      hostUserId: hendra.id,
      createdById: hendra.id,
      visitors: { create: [{ fullName: "Lina Wijaya", company: "Server Upgrade Vendor", status: "Pending" }] },
    },
  });

  console.log("Incidents…");
  const inc1 = await prisma.incident.create({
    data: {
      facilityId: btm02.id,
      buildingId: btm02B.id,
      title: "Power distribution event",
      description: "A PDU on the B-side power feed tripped during routine load balancing. Facility is running normally on the A-side feed; no customer impact expected.",
      severity: "P2",
      status: "Monitoring",
      startedAt: hoursFromNow(-30),
      createdById: noc.id,
      updates: {
        create: [
          { message: "PDU trip identified, A-side feed carrying full load with no redundancy loss.", createdById: noc.id, createdAt: hoursFromNow(-29) },
          { message: "Vendor dispatched to inspect the B-side PDU. ETA 2 hours.", createdById: noc.id, createdAt: hoursFromNow(-20) },
          { message: "B-side feed restored and validated. Continuing to monitor for 24 hours before closing.", createdById: noc.id, createdAt: hoursFromNow(-4) },
        ],
      },
    },
  });
  void inc1;

  await prisma.incident.create({
    data: {
      facilityId: jkt01.id,
      title: "Network switch firmware update issue",
      description: "A firmware update on a core switch caused a brief loss of redundant uplink. Traffic failed over to the secondary path automatically.",
      severity: "P3",
      status: "Resolved",
      startedAt: daysFromNow(-6),
      resolvedAt: daysFromNow(-6),
      createdById: noc.id,
      updates: { create: [{ message: "Rolled back firmware; redundant uplink restored. No customer-reported downtime.", createdById: noc.id, createdAt: daysFromNow(-6) }] },
    },
  });

  await prisma.incident.create({
    data: {
      facilityId: sby01.id,
      title: "Fire suppression system inspection alarm",
      description: "A routine fire suppression inspection triggered a false alarm on Floor 2. No suppression discharge occurred.",
      severity: "P4",
      status: "Resolved",
      startedAt: daysFromNow(-14),
      resolvedAt: daysFromNow(-14),
      createdById: security.id,
      updates: { create: [{ message: "Confirmed false alarm from inspection activity. No action needed.", createdById: security.id, createdAt: daysFromNow(-14) }] },
    },
  });

  await prisma.incident.create({
    data: {
      facilityId: sgp01.id,
      title: "Cooling unit alarm — Building Main Hall",
      description: "One of four CRAC units flagged a high-pressure alarm. Remaining units are covering the load with no temperature deviation.",
      severity: "P3",
      status: "Investigating",
      startedAt: hoursFromNow(-3),
      createdById: noc.id,
      updates: { create: [{ message: "Vendor technician en route to inspect the affected unit.", createdById: noc.id, createdAt: hoursFromNow(-2) }] },
    },
  });

  console.log("Maintenance…");
  await prisma.maintenanceEvent.create({
    data: {
      facilityId: btm02.id,
      title: "Quarterly CRAC unit servicing",
      description: "Quarterly cooling maintenance on Floor 2. Redundant cooling stays online throughout.",
      maintType: "Planned",
      impact: "NoImpact",
      startAt: daysFromNow(6),
      endAt: daysFromNow(6.2),
      status: "Scheduled",
      createdById: noc.id,
      notifications: { create: [{ channel: "IN_APP", audience: "Tenants at BTM-02 — Batam", message: "Planned maintenance scheduled: Quarterly CRAC unit servicing (No impact)." }] },
    },
  });
  await prisma.maintenanceEvent.create({
    data: {
      facilityId: jkt01.id,
      title: "UPS battery replacement",
      description: "Scheduled UPS battery string replacement. Redundancy reduced to N during the window; no expected customer impact.",
      maintType: "Planned",
      impact: "RedundancyReduced",
      startAt: daysFromNow(2),
      endAt: daysFromNow(2.15),
      status: "Scheduled",
      createdById: noc.id,
      notifications: { create: [{ channel: "IN_APP", audience: "Tenants at JKT-01 — Jakarta", message: "Planned maintenance scheduled: UPS battery replacement (Redundancy reduced)." }] },
    },
  });
  await prisma.maintenanceEvent.create({
    data: {
      facilityId: jkt01.id,
      title: "Emergency generator fuel top-up",
      description: "Unscheduled fuel delivery and top-up for the standby generator fleet.",
      maintType: "Emergency",
      impact: "NoImpact",
      startAt: hoursFromNow(-6),
      endAt: hoursFromNow(-4),
      status: "Completed",
      createdById: noc.id,
      notifications: {
        create: [
          { channel: "IN_APP", audience: "Tenants at JKT-01 — Jakarta", message: "Emergency maintenance: generator fuel top-up in progress.", sentAt: hoursFromNow(-6) },
          { channel: "IN_APP", audience: "Tenants at JKT-01 — Jakarta", message: "Emergency maintenance completed: generator fuel top-up.", sentAt: hoursFromNow(-4) },
        ],
      },
    },
  });
  await prisma.maintenanceEvent.create({
    data: {
      facilityId: sby01.id,
      title: "Network switch firmware update",
      description: "Core switch firmware update — no downtime expected.",
      maintType: "Planned",
      impact: "NoImpact",
      startAt: daysFromNow(-9),
      endAt: daysFromNow(-9),
      status: "Completed",
      createdById: noc.id,
      notifications: { create: [{ channel: "IN_APP", audience: "Tenants at SBY-01 — Surabaya", message: "Maintenance completed: network switch firmware update.", sentAt: daysFromNow(-9) }] },
    },
  });

  console.log("Tickets…");
  const t1 = await prisma.ticket.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      category: "Complaint",
      subject: "AC noise near Rack C14",
      description: "Noticeable rattling noise from the CRAC unit near C14 since this morning.",
      status: "InProgress",
      priority: "Normal",
      createdById: ditaAyu.id,
      assignedToId: csManager.id,
    },
  });
  void t1;

  await prisma.ticket.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      category: "RFI",
      subject: "Available rack space at BTM-02 for Q4 expansion",
      description: "Could you confirm current available rack space and power headroom at BTM-02 for a possible Q4 expansion?",
      status: "Submitted",
      priority: "Low",
      createdById: ditaAyu.id,
    },
  });

  const t3 = await prisma.ticket.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      category: "ServiceRequest",
      subject: "New cross-connect to ISP carrier room",
      description: "Please provision a new cross-connect from Cage 7 to the meet-me room for our secondary ISP.",
      status: "Done",
      priority: "Normal",
      createdById: ditaAyu.id,
      assignedToId: csManager.id,
      resolvedAt: daysFromNow(-3),
      csatRating: "up",
    },
  });

  const t4 = await prisma.ticket.create({
    data: {
      siteEnrollmentId: enrNusantaraJkt.id,
      category: "ServiceRequest",
      subject: "Power draw report request",
      description: "Please send our current power draw report for the last billing cycle.",
      status: "Done",
      priority: "Normal",
      createdById: rinaSaputri.id,
      assignedToId: csRep.id,
      resolvedAt: daysFromNow(-1),
      csatRating: "up",
    },
  });

  await prisma.ticket.create({
    data: {
      siteEnrollmentId: enrTrisulaSby.id,
      category: "Complaint",
      subject: "Escalating billing discrepancy",
      description: "This month's invoice doesn't match our contracted rate — please review.",
      status: "Submitted",
      priority: "High",
      createdById: hendra.id,
    },
  });

  await prisma.ticket.create({
    data: {
      siteEnrollmentId: enrHorizonSgp.id,
      category: "RFI",
      subject: "Request for SOC 2 report",
      description: "Our auditors need the latest SOC 2 Type II report for Aurora PDC.",
      status: "InProgress",
      priority: "Normal",
      createdById: michelle.id,
      assignedToId: csRep2.id,
    },
  });

  // Mirror the app's auto-logging behavior for tickets resolved during seeding.
  for (const t of [t3, t4]) {
    await prisma.engagementLog.create({
      data: {
        enterpriseAccountId: t.id === t3.id ? meridian.id : nusantara.id,
        repId: t.assignedToId!,
        type: "ticket",
        notes: `Auto-logged from resolved ticket "${t.subject}".`,
        linkedTicketId: t.id,
        occurredAt: t.resolvedAt ?? NOW,
      },
    });
  }

  console.log("Remote / smart hands…");
  const rh1 = await prisma.remoteHandsTask.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      taskType: "PowerCycle",
      assetRef: "Rack C14 — Switch SW-C14-02",
      description: "Please power-cycle the top-of-rack switch — it's unresponsive to ping but shows link lights.",
      status: "InProgress",
      createdById: ditaAyu.id,
      assignedTechnicianId: tech.id,
      startedAt: hoursFromNow(-0.3),
    },
  });
  void rh1;

  const rh2Photo = await saveCompletionPhoto("rh-112-inspection.jpg");
  const rh2 = await prisma.remoteHandsTask.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      taskType: "VisualInspection",
      assetRef: "Cage 7 — patch cabling",
      description: "Routine visual check on patch cable dressing in Cage 7 ahead of next week's audit.",
      status: "Completed",
      createdById: ditaAyu.id,
      assignedTechnicianId: tech.id,
      startedAt: daysFromNow(-7),
      completedAt: daysFromNow(-7),
      billableMinutes: 18,
      completionNotes: "All patch cables secure, no visible wear. No action needed.",
      completionPhotoUrl: rh2Photo,
      csatRating: "up",
    },
  });

  const rh3 = await prisma.remoteHandsTask.create({
    data: {
      siteEnrollmentId: enrNusantaraJkt.id,
      taskType: "MountUnmountHardware",
      assetRef: "Rack B08",
      description: "Mount replacement 1U server in Rack B08, decommission the old unit.",
      status: "Completed",
      createdById: rinaSaputri.id,
      assignedTechnicianId: tech2.id,
      startedAt: daysFromNow(-15),
      completedAt: daysFromNow(-15),
      billableMinutes: 42,
      completionNotes: "New unit racked and cabled per diagram; old unit staged for pickup.",
      csatRating: "up",
    },
  });

  await prisma.remoteHandsTask.create({
    data: {
      siteEnrollmentId: enrTrisulaSby.id,
      taskType: "KVMConsoleAccess",
      assetRef: "Rack D11 — Server 3",
      description: "Need temporary KVM console access to recover a server that failed to boot after a patch.",
      status: "Accepted",
      createdById: hendra.id,
      assignedTechnicianId: tech.id,
    },
  });

  await prisma.remoteHandsTask.create({
    data: {
      siteEnrollmentId: enrHorizonSgp.id,
      taskType: "CablePatch",
      assetRef: "Suite 2 — Meet-me room",
      description: "Patch a new cross-connect from our suite to Provider X's meet-me room panel.",
      status: "Submitted",
      createdById: michelle.id,
    },
  });

  for (const t of [rh2, rh3]) {
    await prisma.engagementLog.create({
      data: {
        enterpriseAccountId: t.id === rh2.id ? meridian.id : nusantara.id,
        repId: t.assignedTechnicianId!,
        type: "remote_hands",
        notes: `Completed remote hands task: ${t.taskType} — ${t.assetRef} (${t.billableMinutes} billable min).`,
        linkedRemoteHandsTaskId: t.id,
        occurredAt: t.completedAt ?? NOW,
      },
    });
  }

  console.log("Documents…");
  const isoDoc = await saveDocumentPdf(
    "iso27001-2026.pdf",
    "ISO 27001 Certificate — 2026",
    ["Issued to: Aurora PDC", "Scope: All facilities", "Valid through: December 2026"]
  );
  await prisma.document.create({
    data: { title: "ISO 27001 Certificate 2026", category: "Compliance", fileName: "ISO-27001-2026.pdf", storageKey: isoDoc.storageKey, mimeType: "application/pdf", fileSizeKb: isoDoc.fileSizeKb, publishedById: admin.id, publishedAt: daysFromNow(-60) },
  });

  const tiaDoc = await saveDocumentPdf("tia942-btm02.pdf", "TIA-942 Compliance Summary — BTM-02", ["Facility: BTM-02 — Batam", "Rating: Tier III design"]);
  await prisma.document.create({
    data: { title: "TIA-942 Compliance Summary — BTM-02", category: "Compliance", facilityId: btm02.id, fileName: "TIA-942-BTM-02.pdf", storageKey: tiaDoc.storageKey, mimeType: "application/pdf", fileSizeKb: tiaDoc.fileSizeKb, publishedById: admin.id, publishedAt: daysFromNow(-40) },
  });

  const slaMeridian = await saveDocumentPdf(
    "sla-meridian-aug2026.pdf",
    "August 2026 SLA & Uptime Report — Meridian Logistics",
    ["Uptime: 100.00%", "Incidents affecting SLA: 0", "Prepared by: Aurora PDC Customer Success"]
  );
  await prisma.document.create({
    data: { title: "August 2026 SLA & Uptime Report", category: "SLAReport", enterpriseAccountId: meridian.id, facilityId: btm02.id, fileName: "SLA-Report-Aug2026-Meridian.pdf", storageKey: slaMeridian.storageKey, mimeType: "application/pdf", fileSizeKb: slaMeridian.fileSizeKb, publishedById: csManager.id, publishedAt: daysFromNow(-5) },
  });

  const contractNusantara = await saveDocumentPdf(
    "msa-nusantara.pdf",
    "Master Services Agreement — Nusantara Cloud",
    ["Effective date: 2025-01-01", "Term: 3 years"]
  );
  await prisma.document.create({
    data: { title: "Master Services Agreement", category: "Contract", enterpriseAccountId: nusantara.id, fileName: "MSA-Nusantara-Cloud.pdf", storageKey: contractNusantara.storageKey, mimeType: "application/pdf", fileSizeKb: contractNusantara.fileSizeKb, publishedById: admin.id, publishedAt: daysFromNow(-200) },
  });

  const legacyInvoiceDoc = await saveDocumentPdf("invoice-meridian-aug2026.pdf", "Invoice — August 2026 — Meridian Logistics", ["Amount due: USD 18,420.00", "Due date: 2026-09-15"]);
  await prisma.document.create({
    data: { title: "Invoice — August 2026", category: "Invoice", enterpriseAccountId: meridian.id, fileName: "Invoice-Aug2026-Meridian.pdf", storageKey: legacyInvoiceDoc.storageKey, mimeType: "application/pdf", fileSizeKb: legacyInvoiceDoc.fileSizeKb, publishedById: finance.id, publishedAt: daysFromNow(-6) },
  });

  console.log("Invoices…");
  async function makeInvoice(opts: {
    account: { id: string };
    number: string;
    periodStart: Date;
    periodEnd: Date;
    issueDate: Date;
    dueDate: Date;
    status: string;
    lines: { description: string; category: string; quantity: number; unitPrice: number }[];
  }) {
    const subtotal = opts.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const tax = Math.round(subtotal * 0.11 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return prisma.invoice.create({
      data: {
        enterpriseAccountId: opts.account.id,
        invoiceNumber: opts.number,
        periodStart: opts.periodStart,
        periodEnd: opts.periodEnd,
        issueDate: opts.issueDate,
        dueDate: opts.dueDate,
        status: opts.status,
        currency: "USD",
        subtotal: Math.round(subtotal * 100) / 100,
        tax,
        total,
        lineItems: { create: opts.lines.map((l) => ({ ...l, amount: Math.round(l.quantity * l.unitPrice * 100) / 100 })) },
      },
    });
  }

  await makeInvoice({
    account: meridian,
    number: "INV-202607-MRD1",
    periodStart: daysFromNow(-62),
    periodEnd: daysFromNow(-32),
    issueDate: daysFromNow(-30),
    dueDate: daysFromNow(-15),
    status: "Paid",
    lines: [
      { description: "Cage 7 — 20kW colocation space", category: "Space", quantity: 1, unitPrice: 14000 },
      { description: "Power — metered usage", category: "Power", quantity: 1, unitPrice: 3200 },
      { description: "Cross-connect — ISP carrier room", category: "CrossConnect", quantity: 1, unitPrice: 220 },
    ],
  });
  await makeInvoice({
    account: meridian,
    number: "INV-202608-MRD1",
    periodStart: daysFromNow(-32),
    periodEnd: daysFromNow(-2),
    issueDate: daysFromNow(-6),
    dueDate: daysFromNow(9),
    status: "Sent",
    lines: [
      { description: "Cage 7 — 20kW colocation space", category: "Space", quantity: 1, unitPrice: 14000 },
      { description: "Power — metered usage", category: "Power", quantity: 1, unitPrice: 3400 },
      { description: "Remote hands — visual inspection", category: "RemoteHands", quantity: 0.3, unitPrice: 150 },
    ],
  });

  await makeInvoice({
    account: nusantara,
    number: "INV-202608-NSC1",
    periodStart: daysFromNow(-32),
    periodEnd: daysFromNow(-2),
    issueDate: daysFromNow(-20),
    dueDate: daysFromNow(-5),
    status: "Overdue",
    lines: [
      { description: "Rack B08 — 6kW colocation space", category: "Space", quantity: 1, unitPrice: 3200 },
      { description: "Remote hands — mount/unmount hardware", category: "RemoteHands", quantity: 0.7, unitPrice: 150 },
    ],
  });

  await makeInvoice({
    account: trisula,
    number: "INV-202609-TSF1",
    periodStart: daysFromNow(-2),
    periodEnd: daysFromNow(28),
    issueDate: NOW,
    dueDate: daysFromNow(14),
    status: "Draft",
    lines: [{ description: "Rack D11 — 4kW colocation space", category: "Space", quantity: 1, unitPrice: 2100 }],
  });

  await makeInvoice({
    account: horizon,
    number: "INV-202608-HRG1",
    periodStart: daysFromNow(-32),
    periodEnd: daysFromNow(-2),
    issueDate: daysFromNow(-6),
    dueDate: daysFromNow(9),
    status: "Sent",
    lines: [
      { description: "Suite 2 — 15kW colocation space", category: "Space", quantity: 1, unitPrice: 9800 },
      { description: "Power — metered usage", category: "Power", quantity: 1, unitPrice: 2100 },
    ],
  });

  console.log("Manual engagement logs…");
  await prisma.engagementLog.create({ data: { enterpriseAccountId: meridian.id, repId: csManager.id, type: "call", notes: "Quarterly capacity review with Dita Ayu. Discussed Q4 rack expansion at BTM-02, no blockers.", occurredAt: daysFromNow(-3) } });
  await prisma.engagementLog.create({ data: { enterpriseAccountId: nusantara.id, repId: csManager.id, type: "email", notes: "Sent August SLA report ahead of their internal audit deadline.", occurredAt: daysFromNow(-5) } });
  await prisma.engagementLog.create({ data: { enterpriseAccountId: horizon.id, repId: csRep2.id, type: "meeting", notes: "Kickoff call for SGP-01 enrollment — reviewed onboarding checklist.", occurredAt: daysFromNow(-20) } });
  await prisma.engagementLog.create({ data: { enterpriseAccountId: trisula.id, repId: csRep.id, type: "site_visit", notes: "On-site visit to review rack layout ahead of a potential expansion.", occurredAt: daysFromNow(-10) } });

  console.log("Notifications…");
  await prisma.notification.create({ data: { userId: ditaAyu.id, title: "Update: Power distribution event", body: "B-side feed restored and validated. Continuing to monitor for 24 hours before closing.", category: "incident", linkUrl: "/portal/incidents" } });
  await prisma.notification.create({ data: { userId: ditaAyu.id, title: "Maintenance scheduled: Quarterly CRAC unit servicing", body: "Planned maintenance scheduled: Quarterly CRAC unit servicing (NoImpact).", category: "maintenance", linkUrl: "/portal/maintenance" } });
  await prisma.notification.create({ data: { userId: rinaSaputri.id, title: "Invoice INV-202608-NSC1 issued", body: "A new invoice for 6402.00 USD is ready for review.", category: "billing", linkUrl: "/portal/billing", isRead: true } });
  await prisma.notification.create({ data: { userId: ditaAyu.id, title: "Remote hands task completed", body: "\"Cage 7 — patch cabling\" is complete. View the technician's notes and completion proof.", category: "remote_hands", linkUrl: "/portal/remote-hands", isRead: true } });
  await prisma.notification.create({ data: { userId: csManager.id, title: "New ticket assigned", body: "AC noise near Rack C14 was assigned to you.", category: "ticket", linkUrl: "/ops/tickets" } });

  console.log("\nSeed complete.\n");
  console.log("Demo logins (password for all: password123)");
  console.log("  Provider — Super Admin:      admin@aurorapdc.com");
  console.log("  Provider — NOC / Ops:        noc@aurorapdc.com");
  console.log("  Provider — Security:         security@aurorapdc.com");
  console.log("  Provider — CS Manager:       csmanager@aurorapdc.com");
  console.log("  Provider — CS Rep:           cs.rina@aurorapdc.com");
  console.log("  Provider — Field Technician: tech@aurorapdc.com");
  console.log("  Provider — Finance:          finance@aurorapdc.com");
  console.log("  Tenant — Meridian (Global Admin):     dita.ayu@meridianlogistics.com");
  console.log("  Tenant — Meridian (Site Contact):     fajar.nugroho@meridianlogistics.com");
  console.log("  Tenant — Nusantara Cloud (Site Contact): rina.saputri@nusantaracloud.io");
  console.log("  Tenant — Nusantara Cloud (Global Admin): siti.rahayu@nusantaracloud.io");
  console.log("  Tenant — Trisula Fintech (Global Admin): hendra.kusuma@trisulafintech.com");
  console.log("  Tenant — Horizon Retail (Global Admin):  michelle.tan@horizonretail.sg");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
