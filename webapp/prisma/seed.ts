import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { makeSimplePdf, makePdfWithImage } from "../src/lib/pdf";
import { saveGeneratedFile } from "../src/lib/storage";
import { ROLES } from "../src/lib/constants";

const prisma = new PrismaClient();

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

// A 1x1 white pixel — just enough to be a valid, renderable JPEG for demo
// "completion photo" and "signature" records without shipping a binary
// asset in the repo.
const TINY_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

async function saveDocumentPdf(subpath: string, title: string, lines: string[]) {
  const pdf = makeSimplePdf(title, lines);
  const storageKey = await saveGeneratedFile(pdf, `documents/${subpath}`);
  return { storageKey, fileSizeKb: Math.max(1, Math.round(pdf.byteLength / 1024)) };
}

async function saveCompletionPhoto(subpath: string) {
  const buf = Buffer.from(TINY_JPEG_BASE64, "base64");
  return saveGeneratedFile(buf, `photos/${subpath}`);
}

async function saveIncidentReport(subpath: string, title: string, lines: string[]) {
  const pdf = makeSimplePdf(title, lines);
  const storageKey = await saveGeneratedFile(pdf, `incident-reports/${subpath}`);
  return { storageKey, fileSizeKb: Math.max(1, Math.round(pdf.byteLength / 1024)) };
}

async function saveSignOffPdf(subpath: string, title: string, lines: string[]) {
  const pdf = makePdfWithImage(title, lines, {
    jpegBuffer: Buffer.from(TINY_JPEG_BASE64, "base64"),
    widthPx: 400,
    heightPx: 140,
  });
  return saveGeneratedFile(pdf, `signoffs/${subpath}`);
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
    prisma.auditLog.deleteMany(),
    prisma.backupRecord.deleteMany(),
    prisma.authorizedAccessEntry.deleteMany(),
    prisma.systemIntegration.deleteMany(),
    prisma.engagementLog.deleteMany(),
    prisma.invoiceLineItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.document.deleteMany(),
    prisma.serviceRequest.deleteMany(),
    prisma.delivery.deleteMany(),
    prisma.maintenanceNotification.deleteMany(),
    prisma.maintenanceEvent.deleteMany(),
    prisma.incidentUpdate.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.acsIntegrationLog.deleteMany(),
    prisma.visitor.deleteMany(),
    prisma.visitorRequest.deleteMany(),
    prisma.blacklistEntry.deleteMany(),
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
      defaultCurrency: "USD",
      defaultTimezone: "Asia/Jakarta",
      sessionTimeoutMinutes: 60,
    },
  });

  console.log("System integrations…");
  await prisma.systemIntegration.createMany({
    data: [
      { key: "ACS", name: "Access Control System (ACS)", status: "Connected", lastSyncAt: NOW },
      { key: "DCIM", name: "DCIM", status: "Connected", lastSyncAt: hoursFromNow(-2) },
      { key: "BMS", name: "Building Management System (BMS)", status: "Connected", lastSyncAt: hoursFromNow(-1) },
      { key: "SSO", name: "Single Sign-On (SSO)", status: "NotConfigured" },
      { key: "EMAIL", name: "Email / SMTP", status: "Connected", lastSyncAt: hoursFromNow(-6) },
    ],
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
    // Whole-suite tenant (Horizon Retail leases "Suite 2" outright) — this
    // site leases rooms only, no rack-level colocation.
    data: {
      name: "SGP-01 — Singapore",
      code: "SGP-01",
      regionId: regionSG.id,
      timezone: "Asia/Singapore",
      address: "Tai Seng, Singapore",
      offersColoRacks: false,
    },
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
  const sgp01MH = await prisma.building.create({ data: { facilityId: sgp01.id, name: "Main Hall", code: "MH" } });
  void jkt01B;

  console.log("Rooms & racks…");
  const btm02DH1 = await prisma.room.create({
    data: { facilityId: btm02.id, buildingId: btm02A.id, name: "Data Hall 1", code: "DH1", type: "DataHall" },
  });
  await prisma.room.create({
    data: { facilityId: btm02.id, buildingId: btm02A.id, name: "Meet-Me Room", code: "MMR", type: "MeetMeRoom" },
  });
  await prisma.rack.createMany({
    data: [
      { roomId: btm02DH1.id, rackNumber: "C10" },
      { roomId: btm02DH1.id, rackNumber: "C14" },
      { roomId: btm02DH1.id, rackNumber: "C20" },
    ],
  });

  const jkt01DH1 = await prisma.room.create({
    data: { facilityId: jkt01.id, buildingId: jkt01A.id, name: "Data Hall 1", code: "DH1", type: "DataHall" },
  });
  await prisma.rack.create({ data: { roomId: jkt01DH1.id, rackNumber: "B08" } });

  const sby01DH1 = await prisma.room.create({
    data: { facilityId: sby01.id, buildingId: sby01A.id, name: "Data Hall 1", code: "DH1", type: "DataHall" },
  });
  await prisma.rack.createMany({
    data: [
      { roomId: sby01DH1.id, rackNumber: "A02" },
      { roomId: sby01DH1.id, rackNumber: "A03" },
      { roomId: sby01DH1.id, rackNumber: "A04" },
      { roomId: sby01DH1.id, rackNumber: "D11" },
    ],
  });

  // SGP-01 leases whole rooms only — no racks under Suite 2.
  await prisma.room.create({
    data: { facilityId: sgp01.id, buildingId: sgp01MH.id, name: "Suite 2", code: "S2", type: "Office" },
  });

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
  void enrMeridianJkt;
  void enrNusantaraSby;

  console.log("Users…");
  const pw = await hash(DEFAULT_PASSWORD);

  // --- Internal / provider personas ---
  const admin = await prisma.user.create({ data: { name: "Andra Wicaksono", email: "admin@aurorapdc.com", passwordHash: pw, role: ROLES.SYS_ADMIN, title: "Global Sys Admin" } });
  const serviceDesk = await prisma.user.create({ data: { name: "Putri Amelia", email: "servicedesk@aurorapdc.com", passwordHash: pw, role: ROLES.SERVICE_DESK, title: "Service Desk Agent" } });
  const noc = await prisma.user.create({ data: { name: "Agus Firmansyah", email: "noc@aurorapdc.com", passwordHash: pw, role: ROLES.OPS_SITE_MANAGER, title: "Site Manager" } });
  const nocJkt = await prisma.user.create({ data: { name: "Yusuf Hidayat", email: "noc.jkt@aurorapdc.com", passwordHash: pw, role: ROLES.OPS_SITE_MANAGER, title: "Site Manager — JKT-01", restrictedFacilityId: jkt01.id } });
  const security = await prisma.user.create({ data: { name: "Dewi Lestari", email: "security@aurorapdc.com", passwordHash: pw, role: ROLES.OPS_FRONT_OFFICE_SECURITY, title: "Front Office & Security Lead" } });
  const tech = await prisma.user.create({ data: { name: "Yoga Pratama", email: "tech@aurorapdc.com", passwordHash: pw, role: ROLES.OPS_SITE_LEAD, title: "Site Lead — BTM-02", restrictedFacilityId: btm02.id } });
  const tech2 = await prisma.user.create({ data: { name: "Wayan Suryadi", email: "tech2@aurorapdc.com", passwordHash: pw, role: ROLES.OPS_SITE_LEAD, title: "Site Lead — JKT-01", restrictedFacilityId: jkt01.id } });
  const csManager = await prisma.user.create({ data: { name: "Made Wirawan", email: "csmanager@aurorapdc.com", passwordHash: pw, role: ROLES.CS_TEAM, csScope: "Corporate", title: "CS Manager (Corporate)" } });
  const csRep = await prisma.user.create({ data: { name: "Rina Setiawan", email: "cs.rina@aurorapdc.com", passwordHash: pw, role: ROLES.CS_TEAM, csScope: "Region", restrictedRegionId: regionID.id, title: "Customer Success Rep — Indonesia" } });
  const csRep2 = await prisma.user.create({ data: { name: "Agus Firmansyah II", email: "cs.agus@aurorapdc.com", passwordHash: pw, role: ROLES.CS_TEAM, csScope: "Site", restrictedFacilityId: jkt01.id, title: "Customer Success Rep — JKT-01" } });
  const finance = await prisma.user.create({ data: { name: "Budi Santoso", email: "finance@aurorapdc.com", passwordHash: pw, role: ROLES.CS_TEAM, csScope: "Billing", title: "Billing Manager" } });
  const vendor = await prisma.user.create({
    data: { name: "Made Suarjana", email: "vendor@coldchain-support.example.com", passwordHash: pw, role: ROLES.OPS_VENDOR, title: "Contract Technician — ColdChain Support", restrictedFacilityId: btm02.id },
  });

  // --- Tenant / customer personas ---
  const ditaAyu = await prisma.user.create({
    data: { name: "Dita Ayu", email: "dita.ayu@meridianlogistics.com", passwordHash: pw, role: ROLES.TENANT_GLOBAL_ADMIN, title: "IT Infrastructure Manager", enterpriseAccountId: meridian.id },
  });
  const fajar = await prisma.user.create({
    data: { name: "Fajar Nugroho", email: "fajar.nugroho@meridianlogistics.com", passwordHash: pw, role: ROLES.TENANT_SITE_LEAD, title: "Site Lead — BTM-02", enterpriseAccountId: meridian.id, restrictedFacilityId: btm02.id },
  });
  const meridianBilling = await prisma.user.create({
    data: { name: "Wulan Kartika", email: "billing@meridianlogistics.com", passwordHash: pw, role: ROLES.TENANT_BILLING, title: "Accounts Payable", enterpriseAccountId: meridian.id },
  });
  const rinaSaputri = await prisma.user.create({
    data: { name: "Rina Saputri", email: "rina.saputri@nusantaracloud.io", passwordHash: pw, role: ROLES.TENANT_TECH_USER, title: "Site Contact — JKT-01", enterpriseAccountId: nusantara.id, restrictedFacilityId: jkt01.id },
  });
  const sitiRahayu = await prisma.user.create({
    data: { name: "Siti Rahayu", email: "siti.rahayu@nusantaracloud.io", passwordHash: pw, role: ROLES.TENANT_GLOBAL_ADMIN, title: "Head of Infrastructure", enterpriseAccountId: nusantara.id },
  });
  const hendra = await prisma.user.create({
    data: { name: "Hendra Kusuma", email: "hendra.kusuma@trisulafintech.com", passwordHash: pw, role: ROLES.TENANT_GLOBAL_ADMIN, title: "IT Manager", enterpriseAccountId: trisula.id },
  });
  const michelle = await prisma.user.create({
    data: { name: "Michelle Tan", email: "michelle.tan@horizonretail.sg", passwordHash: pw, role: ROLES.TENANT_GLOBAL_ADMIN, title: "Regional IT Director", enterpriseAccountId: horizon.id },
  });

  console.log("Blacklist…");
  await prisma.blacklistEntry.create({
    data: {
      fullName: "Rudi Hartono",
      reason: "Previous unauthorized access attempt at BTM-02 during a contractor visit — flagged by security.",
      createdById: security.id,
    },
  });
  await prisma.blacklistEntry.create({
    data: {
      fullName: "Joko Susilo",
      idNumber: "3201999999999999",
      company: "Unlisted Vendor",
      reason: "Repeated safety-procedure violations during previous site visits.",
      createdById: security.id,
    },
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

  // This batch upload deliberately includes a blacklisted name so the
  // "first layer" screening has something real to demo — Rudi Hartono
  // above is flagged automatically, the other two are ordinary Pending rows.
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
          {
            fullName: "Rudi Hartono",
            company: "Cabling Contractor Indonesia",
            status: "Blacklisted",
            isBlacklistMatch: true,
            blacklistReason: "Previous unauthorized access attempt at BTM-02 during a contractor visit — flagged by security.",
          },
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

  console.log("Deliveries…");
  await prisma.delivery.create({
    data: {
      facilityId: btm02.id,
      enterpriseAccountId: meridian.id,
      courierName: "DHL Express",
      trackingNumber: "DHL8827301",
      description: "Replacement PDU unit",
      status: "Received",
      arrivedAt: daysFromNow(-2),
      receivedAt: daysFromNow(-2),
      receivedById: security.id,
      createdById: noc.id,
    },
  });
  await prisma.delivery.create({
    data: {
      facilityId: jkt01.id,
      enterpriseAccountId: nusantara.id,
      courierName: "JNE Logistics",
      trackingNumber: "JNE5591204",
      description: "Server chassis (3x) for Rack B08 expansion",
      status: "Arrived",
      arrivedAt: hoursFromNow(-5),
      createdById: noc.id,
    },
  });
  await prisma.delivery.create({
    data: {
      facilityId: btm02.id,
      enterpriseAccountId: meridian.id,
      courierName: "Internal fleet",
      description: "Networking cable spools",
      status: "Expected",
      expectedAt: daysFromNow(2),
      recipientName: "Dita Ayu",
      createdById: ditaAyu.id,
    },
  });
  await prisma.delivery.create({
    data: {
      facilityId: sby01.id,
      enterpriseAccountId: trisula.id,
      courierName: "Grab Express",
      description: "Confidential document pickup",
      status: "Rejected",
      notes: "Wrong recipient address on the waybill — returned to sender.",
      createdById: security.id,
    },
  });

  console.log("Authorized Access List…");
  await prisma.authorizedAccessEntry.create({
    data: {
      enterpriseAccountId: meridian.id,
      facilityId: btm02.id,
      fullName: "Bambang Hartawan",
      idType: "KTP",
      idNumber: "3201xxxxxxxxxx88",
      company: "Meridian Logistics",
      accessLevel: "FullAccess",
      reason: "Permanent facilities engineer — daily rack maintenance access.",
      status: "Active",
      requestedById: ditaAyu.id,
      decidedById: noc.id,
      decidedAt: daysFromNow(-45),
      decisionNotes: "Approved — verified employment and background check on file.",
      createdAt: daysFromNow(-46),
    },
  });
  await prisma.authorizedAccessEntry.create({
    data: {
      enterpriseAccountId: meridian.id,
      facilityId: btm02.id,
      fullName: "Cahyo Nugraha",
      company: "Cabling Contractor Indonesia",
      accessLevel: "Escorted",
      reason: "Recurring cabling contractor — quarterly audits through year-end.",
      validUntil: daysFromNow(90),
      status: "PendingApproval",
      requestedById: fajar.id,
    },
  });
  await prisma.authorizedAccessEntry.create({
    data: {
      enterpriseAccountId: nusantara.id,
      facilityId: jkt01.id,
      fullName: "Dewa Putu Aditya",
      company: "Nusantara Cloud",
      accessLevel: "Standard",
      reason: "On-site systems engineer — daily business-hours access.",
      status: "Active",
      requestedById: sitiRahayu.id,
      decidedById: nocJkt.id,
      decidedAt: daysFromNow(-10),
      createdAt: daysFromNow(-11),
    },
  });

  console.log("Incidents…");
  const inc1 = await prisma.incident.create({
    data: {
      facilityId: btm02.id,
      buildingId: btm02B.id,
      title: "Power distribution event",
      description: "A PDU on the B-side power feed tripped during routine load balancing. Facility is running normally on the A-side feed; no customer impact expected.",
      category: "Electrical",
      impactedServices: JSON.stringify(["Power"]),
      locationDetail: "Building B, PDU B-3",
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

  const networkReport = await saveIncidentReport(
    "network-firmware-incident-jkt01.pdf",
    "Incident Closure Report — Network Switch Firmware Update",
    [
      "Facility: JKT-01 — Jakarta",
      "Severity: P3",
      "Root cause: firmware regression on core switch redundant-uplink negotiation.",
      "Resolution: rolled back to prior firmware version; redundant uplink restored.",
      "Customer impact: none reported — automatic failover to secondary path.",
      "Prepared by: NOC Engineering, exported from DCIM incident log.",
    ]
  );
  await prisma.incident.create({
    data: {
      facilityId: jkt01.id,
      title: "Network switch firmware update issue",
      description: "A firmware update on a core switch caused a brief loss of redundant uplink. Traffic failed over to the secondary path automatically.",
      category: "Network",
      impactedServices: JSON.stringify(["Network"]),
      locationDetail: "Core network room",
      severity: "P3",
      status: "Resolved",
      startedAt: daysFromNow(-6),
      resolvedAt: daysFromNow(-6),
      createdById: noc.id,
      reportFileName: "Network-Firmware-Incident-JKT01.pdf",
      reportStorageKey: networkReport.storageKey,
      reportUploadedById: noc.id,
      reportUploadedAt: daysFromNow(-6),
      updates: { create: [{ message: "Rolled back firmware; redundant uplink restored. No customer-reported downtime.", createdById: noc.id, createdAt: daysFromNow(-6) }] },
    },
  });

  await prisma.incident.create({
    data: {
      facilityId: sby01.id,
      title: "Fire suppression system inspection alarm",
      description: "A routine fire suppression inspection triggered a false alarm on Floor 2. No suppression discharge occurred.",
      category: "Fire",
      impactedServices: JSON.stringify(["Fire Suppression"]),
      locationDetail: "Floor 2",
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
      category: "Mechanical",
      impactedServices: JSON.stringify(["Cooling"]),
      locationDetail: "Main Hall, CRAC-04",
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

  console.log("Service requests…");
  const sr1 = await prisma.serviceRequest.create({
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
  void sr1;

  await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      category: "RFI",
      subject: "Available rack space at BTM-02 for Q4 expansion",
      description: "Could you confirm current available rack space and power headroom at BTM-02 for a possible Q4 expansion?",
      status: "Accepted",
      priority: "Low",
      createdById: ditaAyu.id,
      assignedToId: serviceDesk.id,
    },
  });

  const sr3 = await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      category: "Other",
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

  const sr4 = await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrNusantaraJkt.id,
      category: "Other",
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

  await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrTrisulaSby.id,
      category: "Complaint",
      subject: "Escalating billing discrepancy",
      description: "This month's invoice doesn't match our contracted rate — please review.",
      status: "InProgress",
      priority: "High",
      createdById: hendra.id,
      assignedToId: finance.id,
    },
  });

  await prisma.serviceRequest.create({
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

  await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      category: "SiteWalkEscort",
      subject: "Escort for auditor site walk",
      description: "Our compliance auditor needs an escorted walk-through of Cage 7 and the shared corridor.",
      status: "Accepted",
      priority: "Normal",
      createdById: ditaAyu.id,
      assignedToId: security.id,
      scheduledStart: daysFromNow(4.4),
      scheduledEnd: daysFromNow(4.5),
    },
  });

  await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrNusantaraJkt.id,
      category: "GeneralMeeting",
      subject: "Quarterly business review",
      description: "Quarterly business review — capacity roadmap and SLA performance.",
      status: "Submitted",
      priority: "Normal",
      createdById: rinaSaputri.id,
      scheduledStart: daysFromNow(10.6),
      scheduledEnd: daysFromNow(10.7),
    },
  });

  console.log("Remote / smart hands (a Service Request category)…");
  const rh1 = await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      category: "RemoteHands",
      taskType: "PowerCycle",
      assetRef: "Rack C14 — Switch SW-C14-02",
      subject: "Power-cycle unresponsive switch",
      description: "Please power-cycle the top-of-rack switch — it's unresponsive to ping but shows link lights.",
      status: "InProgress",
      priority: "Urgent",
      createdById: ditaAyu.id,
      assignedToId: vendor.id,
      startedAt: hoursFromNow(-0.3),
    },
  });
  void rh1;

  const rh2Photo = await saveCompletionPhoto("rh-112-inspection.jpg");
  const rh2SignOffKey = await saveSignOffPdf(
    "rh-112-signoff.pdf",
    "Remote Hands — Sign-off / Acceptance Certificate",
    [
      "Tenant: Meridian Logistics",
      "Facility: BTM-02 — Batam",
      "Task: Visual Inspection",
      "Asset / rack: Cage 7 — patch cabling",
      "Description: Routine visual check on patch cable dressing in Cage 7 ahead of next week's audit.",
      "Completion notes: All patch cables secure, no visible wear. No action needed.",
      "Billable minutes: 18",
      "",
      "Customer acceptance:",
      "Signed by: Dita Ayu",
      "Title: IT Infrastructure Manager",
      `Date: ${daysFromNow(-7).toLocaleString()}`,
    ]
  );
  const rh2 = await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrMeridianBtm.id,
      category: "RemoteHands",
      taskType: "VisualInspection",
      assetRef: "Cage 7 — patch cabling",
      subject: "Visual inspection ahead of audit",
      description: "Routine visual check on patch cable dressing in Cage 7 ahead of next week's audit.",
      status: "Done",
      priority: "Normal",
      createdById: ditaAyu.id,
      assignedToId: tech.id,
      startedAt: daysFromNow(-7),
      completedAt: daysFromNow(-7),
      resolvedAt: daysFromNow(-7),
      billableMinutes: 18,
      completionNotes: "All patch cables secure, no visible wear. No action needed.",
      completionPhotoUrl: rh2Photo,
      csatRating: "up",
      signOffName: "Dita Ayu",
      signOffTitle: "IT Infrastructure Manager",
      signOffSignedAt: daysFromNow(-7),
      signOffPdfStorageKey: rh2SignOffKey,
    },
  });

  // Deliberately left without a sign-off yet, so logging in as Nusantara
  // shows the live "sign here" flow rather than only the completed state.
  const rh3 = await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrNusantaraJkt.id,
      category: "RemoteHands",
      taskType: "MountUnmountHardware",
      assetRef: "Rack B08",
      subject: "Mount replacement server",
      description: "Mount replacement 1U server in Rack B08, decommission the old unit.",
      status: "Done",
      priority: "Normal",
      createdById: rinaSaputri.id,
      assignedToId: tech2.id,
      startedAt: daysFromNow(-15),
      completedAt: daysFromNow(-15),
      resolvedAt: daysFromNow(-15),
      billableMinutes: 42,
      completionNotes: "New unit racked and cabled per diagram; old unit staged for pickup.",
    },
  });

  await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrTrisulaSby.id,
      category: "RemoteHands",
      taskType: "KVMConsoleAccess",
      assetRef: "Rack D11 — Server 3",
      subject: "Temporary KVM console access",
      description: "Need temporary KVM console access to recover a server that failed to boot after a patch.",
      status: "Accepted",
      priority: "High",
      createdById: hendra.id,
      assignedToId: tech.id,
    },
  });

  await prisma.serviceRequest.create({
    data: {
      siteEnrollmentId: enrHorizonSgp.id,
      category: "RemoteHands",
      taskType: "CablePatch",
      assetRef: "Suite 2 — Meet-me room",
      subject: "New cross-connect patch",
      description: "Patch a new cross-connect from our suite to Provider X's meet-me room panel.",
      status: "Submitted",
      priority: "Normal",
      createdById: michelle.id,
    },
  });

  // Mirror the app's auto-logging behavior for requests resolved during seeding.
  for (const sr of [sr3, sr4, rh2, rh3]) {
    await prisma.engagementLog.create({
      data: {
        enterpriseAccountId: sr.id === sr4.id || sr.id === rh3.id ? nusantara.id : meridian.id,
        repId: sr.assignedToId!,
        type: "service_request",
        notes: `Auto-logged from completed request "${sr.subject}".`,
        linkedServiceRequestId: sr.id,
        occurredAt: sr.resolvedAt ?? NOW,
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

  const legacyInvoiceDoc = await saveDocumentPdf("invoice-meridian-aug2026.pdf", "Invoice — August 2026 — Meridian Logistics", ["Amount due: USD 18,420.00", "Due date: 2026-09-15"]);
  await prisma.document.create({
    data: { title: "Invoice — August 2026", category: "Invoice", enterpriseAccountId: meridian.id, fileName: "Invoice-Aug2026-Meridian.pdf", storageKey: legacyInvoiceDoc.storageKey, mimeType: "application/pdf", fileSizeKb: legacyInvoiceDoc.fileSizeKb, publishedById: finance.id, publishedAt: daysFromNow(-6) },
  });

  const termsDoc = await saveDocumentPdf(
    "terms-and-conditions.pdf",
    "Aurora PDC — Colocation Terms & Conditions",
    ["Applies to all colocation and service agreements.", "Effective date: 2025-01-01", "See your Master Services Agreement for account-specific terms."]
  );
  await prisma.document.create({
    data: { title: "Terms & Conditions", category: "TermsConditions", fileName: "Aurora-PDC-Terms-and-Conditions.pdf", storageKey: termsDoc.storageKey, mimeType: "application/pdf", fileSizeKb: termsDoc.fileSizeKb, publishedById: admin.id, publishedAt: daysFromNow(-365) },
  });

  for (const f of [btm02, jkt01, sby01, sgp01]) {
    const siteIntro = await saveDocumentPdf(
      `site-introduction-${f.code.toLowerCase()}.pdf`,
      `Site Introduction — ${f.name}`,
      [
        `Facility code: ${f.code}`,
        `Address: ${f.address ?? "—"}`,
        "Access hours, loading dock procedures, and emergency contacts are covered in this pack.",
        "Please review before your first on-site visit.",
      ]
    );
    await prisma.document.create({
      data: {
        title: `Site Introduction — ${f.name}`,
        category: "SiteIntroduction",
        facilityId: f.id,
        fileName: `Site-Introduction-${f.code}.pdf`,
        storageKey: siteIntro.storageKey,
        mimeType: "application/pdf",
        fileSizeKb: siteIntro.fileSizeKb,
        publishedById: admin.id,
        publishedAt: daysFromNow(-180),
      },
    });
  }

  for (const account of [meridian, nusantara, trisula, horizon]) {
    const contract = await saveDocumentPdf(
      `msa-${account.id}.pdf`,
      `Master Services Agreement — ${account.name}`,
      ["Effective date: 2025-01-01", "Term: 3 years", "Governed by Aurora PDC's standard Terms & Conditions."]
    );
    await prisma.document.create({
      data: {
        title: "Master Services Agreement",
        category: "Contract",
        enterpriseAccountId: account.id,
        fileName: `MSA-${account.name.replace(/\s+/g, "-")}.pdf`,
        storageKey: contract.storageKey,
        mimeType: "application/pdf",
        fileSizeKb: contract.fileSizeKb,
        publishedById: admin.id,
        publishedAt: daysFromNow(-200),
      },
    });
  }

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
      { description: "Remote hands — visual inspection (signed off, see Download Center)", category: "RemoteHands", quantity: 0.3, unitPrice: 150 },
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
  await prisma.notification.create({ data: { userId: ditaAyu.id, title: "Remote hands task completed", body: "\"Cage 7 — patch cabling\" is complete. View the technician's notes, completion proof, and sign your acceptance.", category: "service_request", linkUrl: `/portal/service-requests/${rh2.id}`, isRead: true } });
  await prisma.notification.create({ data: { userId: rinaSaputri.id, title: "Remote hands task completed", body: "\"Rack B08\" is complete — please review and sign the acceptance certificate.", category: "service_request", linkUrl: `/portal/service-requests/${rh3.id}` } });
  await prisma.notification.create({ data: { userId: csManager.id, title: "New service request assigned", body: "AC noise near Rack C14 was assigned to you.", category: "service_request", linkUrl: "/ops/service-requests" } });
  await prisma.notification.create({ data: { userId: ditaAyu.id, title: "A delivery has arrived", body: "JNE Logistics: Server chassis (3x) for Rack B08 expansion", category: "delivery", linkUrl: "/portal/deliveries" } });
  await prisma.notification.create({ data: { userId: meridianBilling.id, title: "Invoice INV-202608-MRD1 issued", body: "A new invoice is ready for review.", category: "billing", linkUrl: "/portal/billing" } });

  console.log("System logs (demo)…");
  await prisma.auditLog.create({ data: { actorId: admin.id, action: "tenant.create", summary: "Created tenant account Horizon Retail Group.", targetType: "EnterpriseAccount", targetId: horizon.id, createdAt: daysFromNow(-200) } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: "facility.create", summary: "Created facility SGP-01 — Singapore.", targetType: "Facility", targetId: sgp01.id, createdAt: daysFromNow(-210) } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: "branding.update", summary: "Updated provider branding (Aurora PDC).", createdAt: daysFromNow(-90) } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: "user.create", summary: "Created user Made Suarjana (OPS_VENDOR).", targetType: "User", targetId: vendor.id, createdAt: daysFromNow(-3) } });
  await prisma.auditLog.create({ data: { actorId: noc.id, action: "aal.approve", summary: "Approved AAL request for Bambang Hartawan.", createdAt: daysFromNow(-45) } });

  console.log("\nSeed complete.\n");
  console.log("Demo logins (password for all: password123)");
  console.log("  --- Internal / provider personas ---");
  console.log("  Global Sys Admin:                 admin@aurorapdc.com");
  console.log("  Service Desk:                      servicedesk@aurorapdc.com");
  console.log("  Ops — Site Manager (all sites):    noc@aurorapdc.com");
  console.log("  Ops — Site Manager (JKT-01 only):  noc.jkt@aurorapdc.com");
  console.log("  Ops — Front Office & Security:      security@aurorapdc.com");
  console.log("  Ops — Site Lead (BTM-02):          tech@aurorapdc.com");
  console.log("  Ops — Site Lead (JKT-01):          tech2@aurorapdc.com");
  console.log("  CS Team — Corporate:               csmanager@aurorapdc.com");
  console.log("  CS Team — Region (Indonesia):       cs.rina@aurorapdc.com");
  console.log("  CS Team — Site (JKT-01):           cs.agus@aurorapdc.com");
  console.log("  CS Team — Billing:                  finance@aurorapdc.com");
  console.log("  Ops — External Vendor:             vendor@coldchain-support.example.com");
  console.log("  --- Tenant / customer personas ---");
  console.log("  Meridian — Global Admin:            dita.ayu@meridianlogistics.com");
  console.log("  Meridian — Site Lead (BTM-02):       fajar.nugroho@meridianlogistics.com");
  console.log("  Meridian — Billing:                 billing@meridianlogistics.com");
  console.log("  Nusantara Cloud — Tech User:        rina.saputri@nusantaracloud.io");
  console.log("  Nusantara Cloud — Global Admin:      siti.rahayu@nusantaracloud.io");
  console.log("  Trisula Fintech — Global Admin:      hendra.kusuma@trisulafintech.com");
  console.log("  Horizon Retail — Global Admin:       michelle.tan@horizonretail.sg");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
