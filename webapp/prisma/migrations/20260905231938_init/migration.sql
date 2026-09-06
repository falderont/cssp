-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER_GLOBAL', 'CUSTOMER_SITE', 'PROVIDER_ADMIN', 'PROVIDER_CS', 'PROVIDER_CS_MANAGER', 'PROVIDER_OPS', 'PROVIDER_SECURITY', 'PROVIDER_TECHNICIAN');

-- CreateEnum
CREATE TYPE "SiteEnrollmentStatus" AS ENUM ('ACTIVE', 'PENDING', 'ENDED');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CHECKED_IN', 'CHECKED_OUT');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('INCIDENT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'MONITORING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "IncidentSource" AS ENUM ('MANUAL', 'DCIM', 'CMMS');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('SLA_REPORT', 'COMPLIANCE_CERTIFICATE', 'INVOICE_BACKUP', 'RUNBOOK', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('COMPLAINT', 'RFI', 'SERVICE_REQUEST');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RemoteHandsTaskType" AS ENUM ('POWER_CYCLE', 'VISUAL_INSPECTION', 'CABLE_PATCH', 'MOUNT_UNMOUNT', 'KVM_ACCESS', 'OTHER');

-- CreateEnum
CREATE TYPE "RemoteHandsStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'SITE_VISIT', 'TICKET', 'REMOTE_HANDS');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "InvoiceLineCategory" AS ENUM ('RECURRING', 'REMOTE_HANDS', 'ONE_TIME', 'OTHER');

-- CreateEnum
CREATE TYPE "IntegrationKind" AS ENUM ('ACCESS_CONTROL', 'DCIM', 'CMMS', 'BMS', 'BILLING');

-- CreateEnum
CREATE TYPE "IntegrationMode" AS ENUM ('MOCK', 'LIVE');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "regionId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_enrollments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enterpriseAccountId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "status" "SiteEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enterpriseAccountId" TEXT,
    "siteEnrollmentId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteEnrollmentId" TEXT NOT NULL,
    "buildingId" TEXT,
    "visitorName" TEXT NOT NULL,
    "visitorCompany" TEXT,
    "hostUserId" TEXT NOT NULL,
    "visitStart" TIMESTAMP(3) NOT NULL,
    "visitEnd" TIMESTAMP(3) NOT NULL,
    "status" "VisitorStatus" NOT NULL DEFAULT 'PENDING',
    "accessCredentialRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents_and_maintenance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" "IncidentSource" NOT NULL DEFAULT 'MANUAL',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_and_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enterpriseAccountId" TEXT NOT NULL,
    "facilityId" TEXT,
    "title" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "fileRef" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "publishedByUserId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteEnrollmentId" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "subtype" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdByUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "csatRating" INTEGER,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_hands_tasks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteEnrollmentId" TEXT NOT NULL,
    "taskType" "RemoteHandsTaskType" NOT NULL,
    "assetOrRackRef" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedWindowStart" TIMESTAMP(3),
    "requestedWindowEnd" TIMESTAMP(3),
    "status" "RemoteHandsStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdByUserId" TEXT NOT NULL,
    "assignedTechnicianId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "billableMinutes" INTEGER,
    "completionNotes" TEXT,
    "completionPhotoRef" TEXT,
    "csatRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remote_hands_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enterpriseAccountId" TEXT NOT NULL,
    "siteEnrollmentId" TEXT,
    "loggedByUserId" TEXT NOT NULL,
    "type" "EngagementType" NOT NULL,
    "notes" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedTicketId" TEXT,
    "linkedRemoteHandsTaskId" TEXT,

    CONSTRAINT "engagement_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enterpriseAccountId" TEXT NOT NULL,
    "facilityId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "externalRef" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "InvoiceLineCategory" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmount" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "linkedRemoteHandsTaskId" TEXT,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bms_telemetry_readings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "buildingId" TEXT,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bms_telemetry_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" "IntegrationKind" NOT NULL,
    "mode" "IntegrationMode" NOT NULL DEFAULT 'MOCK',
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regions_organizationId_idx" ON "regions"("organizationId");

-- CreateIndex
CREATE INDEX "facilities_organizationId_idx" ON "facilities"("organizationId");

-- CreateIndex
CREATE INDEX "facilities_regionId_idx" ON "facilities"("regionId");

-- CreateIndex
CREATE INDEX "buildings_organizationId_idx" ON "buildings"("organizationId");

-- CreateIndex
CREATE INDEX "buildings_facilityId_idx" ON "buildings"("facilityId");

-- CreateIndex
CREATE INDEX "enterprise_accounts_organizationId_idx" ON "enterprise_accounts"("organizationId");

-- CreateIndex
CREATE INDEX "site_enrollments_organizationId_idx" ON "site_enrollments"("organizationId");

-- CreateIndex
CREATE INDEX "site_enrollments_facilityId_idx" ON "site_enrollments"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "site_enrollments_enterpriseAccountId_facilityId_key" ON "site_enrollments"("enterpriseAccountId", "facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_enterpriseAccountId_idx" ON "users"("enterpriseAccountId");

-- CreateIndex
CREATE INDEX "users_siteEnrollmentId_idx" ON "users"("siteEnrollmentId");

-- CreateIndex
CREATE INDEX "visitors_organizationId_idx" ON "visitors"("organizationId");

-- CreateIndex
CREATE INDEX "visitors_siteEnrollmentId_idx" ON "visitors"("siteEnrollmentId");

-- CreateIndex
CREATE INDEX "incidents_and_maintenance_organizationId_idx" ON "incidents_and_maintenance"("organizationId");

-- CreateIndex
CREATE INDEX "incidents_and_maintenance_facilityId_idx" ON "incidents_and_maintenance"("facilityId");

-- CreateIndex
CREATE INDEX "documents_organizationId_idx" ON "documents"("organizationId");

-- CreateIndex
CREATE INDEX "documents_enterpriseAccountId_idx" ON "documents"("enterpriseAccountId");

-- CreateIndex
CREATE INDEX "tickets_organizationId_idx" ON "tickets"("organizationId");

-- CreateIndex
CREATE INDEX "tickets_siteEnrollmentId_idx" ON "tickets"("siteEnrollmentId");

-- CreateIndex
CREATE INDEX "remote_hands_tasks_organizationId_idx" ON "remote_hands_tasks"("organizationId");

-- CreateIndex
CREATE INDEX "remote_hands_tasks_siteEnrollmentId_idx" ON "remote_hands_tasks"("siteEnrollmentId");

-- CreateIndex
CREATE INDEX "engagement_logs_organizationId_idx" ON "engagement_logs"("organizationId");

-- CreateIndex
CREATE INDEX "engagement_logs_enterpriseAccountId_idx" ON "engagement_logs"("enterpriseAccountId");

-- CreateIndex
CREATE INDEX "invoices_organizationId_idx" ON "invoices"("organizationId");

-- CreateIndex
CREATE INDEX "invoices_enterpriseAccountId_idx" ON "invoices"("enterpriseAccountId");

-- CreateIndex
CREATE INDEX "invoice_line_items_organizationId_idx" ON "invoice_line_items"("organizationId");

-- CreateIndex
CREATE INDEX "invoice_line_items_invoiceId_idx" ON "invoice_line_items"("invoiceId");

-- CreateIndex
CREATE INDEX "bms_telemetry_readings_organizationId_idx" ON "bms_telemetry_readings"("organizationId");

-- CreateIndex
CREATE INDEX "bms_telemetry_readings_facilityId_metric_recordedAt_idx" ON "bms_telemetry_readings"("facilityId", "metric", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_organizationId_kind_key" ON "integration_configs"("organizationId", "kind");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_accounts" ADD CONSTRAINT "enterprise_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_enrollments" ADD CONSTRAINT "site_enrollments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_enrollments" ADD CONSTRAINT "site_enrollments_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_enrollments" ADD CONSTRAINT "site_enrollments_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_siteEnrollmentId_fkey" FOREIGN KEY ("siteEnrollmentId") REFERENCES "site_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_siteEnrollmentId_fkey" FOREIGN KEY ("siteEnrollmentId") REFERENCES "site_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents_and_maintenance" ADD CONSTRAINT "incidents_and_maintenance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents_and_maintenance" ADD CONSTRAINT "incidents_and_maintenance_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_siteEnrollmentId_fkey" FOREIGN KEY ("siteEnrollmentId") REFERENCES "site_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_hands_tasks" ADD CONSTRAINT "remote_hands_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_hands_tasks" ADD CONSTRAINT "remote_hands_tasks_siteEnrollmentId_fkey" FOREIGN KEY ("siteEnrollmentId") REFERENCES "site_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_hands_tasks" ADD CONSTRAINT "remote_hands_tasks_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_hands_tasks" ADD CONSTRAINT "remote_hands_tasks_assignedTechnicianId_fkey" FOREIGN KEY ("assignedTechnicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_logs" ADD CONSTRAINT "engagement_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_logs" ADD CONSTRAINT "engagement_logs_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_logs" ADD CONSTRAINT "engagement_logs_siteEnrollmentId_fkey" FOREIGN KEY ("siteEnrollmentId") REFERENCES "site_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_logs" ADD CONSTRAINT "engagement_logs_loggedByUserId_fkey" FOREIGN KEY ("loggedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_logs" ADD CONSTRAINT "engagement_logs_linkedTicketId_fkey" FOREIGN KEY ("linkedTicketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_logs" ADD CONSTRAINT "engagement_logs_linkedRemoteHandsTaskId_fkey" FOREIGN KEY ("linkedRemoteHandsTaskId") REFERENCES "remote_hands_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_linkedRemoteHandsTaskId_fkey" FOREIGN KEY ("linkedRemoteHandsTaskId") REFERENCES "remote_hands_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bms_telemetry_readings" ADD CONSTRAINT "bms_telemetry_readings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bms_telemetry_readings" ADD CONSTRAINT "bms_telemetry_readings_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bms_telemetry_readings" ADD CONSTRAINT "bms_telemetry_readings_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_configs" ADD CONSTRAINT "integration_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
