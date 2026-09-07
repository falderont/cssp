-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteEnrollmentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "buildingId" TEXT,
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
    CONSTRAINT "ServiceRequest_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceRequest" ("assetRef", "assignedToId", "billableMinutes", "category", "completedAt", "completionNotes", "completionPhotoUrl", "createdAt", "createdById", "csatRating", "description", "id", "priority", "resolvedAt", "scheduledEnd", "scheduledStart", "signOffName", "signOffPdfStorageKey", "signOffSignedAt", "signOffTitle", "siteEnrollmentId", "startedAt", "status", "subject", "taskType") SELECT "assetRef", "assignedToId", "billableMinutes", "category", "completedAt", "completionNotes", "completionPhotoUrl", "createdAt", "createdById", "csatRating", "description", "id", "priority", "resolvedAt", "scheduledEnd", "scheduledStart", "signOffName", "signOffPdfStorageKey", "signOffSignedAt", "signOffTitle", "siteEnrollmentId", "startedAt", "status", "subject", "taskType" FROM "ServiceRequest";
DROP TABLE "ServiceRequest";
ALTER TABLE "new_ServiceRequest" RENAME TO "ServiceRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
