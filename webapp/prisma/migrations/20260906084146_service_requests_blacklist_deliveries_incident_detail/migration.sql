/*
  Warnings:

  - You are about to drop the `RemoteHandsTask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `linkedRemoteHandsTaskId` on the `EngagementLog` table. All the data in the column will be lost.
  - You are about to drop the column `linkedTicketId` on the `EngagementLog` table. All the data in the column will be lost.
  - The required column `verificationToken` was added to the `Visitor` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RemoteHandsTask";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Ticket";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "BlacklistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "idNumber" TEXT,
    "company" TEXT,
    "reason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlacklistEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityId" TEXT NOT NULL,
    "enterpriseAccountId" TEXT,
    "courierName" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "description" TEXT NOT NULL,
    "recipientName" TEXT,
    "expectedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Expected',
    "arrivedAt" DATETIME,
    "receivedAt" DATETIME,
    "receivedById" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Delivery_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Delivery_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "EnterpriseAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteEnrollmentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "scheduledStart" DATETIME,
    "scheduledEnd" DATETIME,
    "taskType" TEXT,
    "assetRef" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "billableMinutes" INTEGER,
    "completionNotes" TEXT,
    "completionPhotoUrl" TEXT,
    "signOffName" TEXT,
    "signOffTitle" TEXT,
    "signOffSignedAt" DATETIME,
    "signOffPdfStorageKey" TEXT,
    "csatRating" TEXT,
    CONSTRAINT "ServiceRequest_siteEnrollmentId_fkey" FOREIGN KEY ("siteEnrollmentId") REFERENCES "SiteEnrollment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EngagementLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterpriseAccountId" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedServiceRequestId" TEXT,
    CONSTRAINT "EngagementLog_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "EnterpriseAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EngagementLog_repId_fkey" FOREIGN KEY ("repId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EngagementLog" ("enterpriseAccountId", "id", "notes", "occurredAt", "repId", "type") SELECT "enterpriseAccountId", "id", "notes", "occurredAt", "repId", "type" FROM "EngagementLog";
DROP TABLE "EngagementLog";
ALTER TABLE "new_EngagementLog" RENAME TO "EngagementLog";
CREATE TABLE "new_Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityId" TEXT NOT NULL,
    "buildingId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "impactedServices" TEXT NOT NULL DEFAULT '[]',
    "locationDetail" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'P3',
    "status" TEXT NOT NULL DEFAULT 'Investigating',
    "isCustomerVisible" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportFileName" TEXT,
    "reportStorageKey" TEXT,
    "reportUploadedById" TEXT,
    "reportUploadedAt" DATETIME,
    CONSTRAINT "Incident_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Incident_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Incident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Incident_reportUploadedById_fkey" FOREIGN KEY ("reportUploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Incident" ("buildingId", "createdAt", "createdById", "description", "facilityId", "id", "isCustomerVisible", "resolvedAt", "severity", "startedAt", "status", "title") SELECT "buildingId", "createdAt", "createdById", "description", "facilityId", "id", "isCustomerVisible", "resolvedAt", "severity", "startedAt", "status", "title" FROM "Incident";
DROP TABLE "Incident";
ALTER TABLE "new_Incident" RENAME TO "Incident";
CREATE TABLE "new_Visitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorRequestId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "idType" TEXT,
    "idNumber" TEXT,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "badgeCode" TEXT,
    "checkedInAt" DATETIME,
    "checkedOutAt" DATETIME,
    "verificationToken" TEXT NOT NULL,
    "isBlacklistMatch" BOOLEAN NOT NULL DEFAULT false,
    "blacklistReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visitor_visitorRequestId_fkey" FOREIGN KEY ("visitorRequestId") REFERENCES "VisitorRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Visitor" ("badgeCode", "checkedInAt", "checkedOutAt", "company", "createdAt", "email", "fullName", "id", "idNumber", "idType", "phone", "status", "visitorRequestId") SELECT "badgeCode", "checkedInAt", "checkedOutAt", "company", "createdAt", "email", "fullName", "id", "idNumber", "idType", "phone", "status", "visitorRequestId" FROM "Visitor";
DROP TABLE "Visitor";
ALTER TABLE "new_Visitor" RENAME TO "Visitor";
CREATE UNIQUE INDEX "Visitor_verificationToken_key" ON "Visitor"("verificationToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
