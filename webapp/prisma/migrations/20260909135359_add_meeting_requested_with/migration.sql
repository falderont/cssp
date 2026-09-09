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
    "requestedWithId" TEXT,
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
    CONSTRAINT "ServiceRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_requestedWithId_fkey" FOREIGN KEY ("requestedWithId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceRequest" ("assetRef", "assignedToId", "billableMinutes", "buildingId", "category", "completedAt", "completionNotes", "completionPhotoUrl", "createdAt", "createdById", "csatRating", "description", "id", "priority", "resolvedAt", "scheduledEnd", "scheduledStart", "signOffName", "signOffPdfStorageKey", "signOffSignedAt", "signOffTitle", "siteEnrollmentId", "startedAt", "status", "subject", "taskType") SELECT "assetRef", "assignedToId", "billableMinutes", "buildingId", "category", "completedAt", "completionNotes", "completionPhotoUrl", "createdAt", "createdById", "csatRating", "description", "id", "priority", "resolvedAt", "scheduledEnd", "scheduledStart", "signOffName", "signOffPdfStorageKey", "signOffSignedAt", "signOffTitle", "siteEnrollmentId", "startedAt", "status", "subject", "taskType" FROM "ServiceRequest";
DROP TABLE "ServiceRequest";
ALTER TABLE "new_ServiceRequest" RENAME TO "ServiceRequest";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "csScope" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEscalationContact" BOOLEAN NOT NULL DEFAULT false,
    "accentColor" TEXT,
    "density" TEXT NOT NULL DEFAULT 'comfortable',
    "mutedNotificationCategories" TEXT NOT NULL DEFAULT '',
    "enterpriseAccountId" TEXT,
    "restrictedFacilityId" TEXT,
    "restrictedRegionId" TEXT,
    "restrictedCountryId" TEXT,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "EnterpriseAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_restrictedFacilityId_fkey" FOREIGN KEY ("restrictedFacilityId") REFERENCES "Facility" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_restrictedRegionId_fkey" FOREIGN KEY ("restrictedRegionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_restrictedCountryId_fkey" FOREIGN KEY ("restrictedCountryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("accentColor", "avatarUrl", "createdAt", "csScope", "density", "email", "enterpriseAccountId", "id", "isActive", "mutedNotificationCategories", "name", "passwordHash", "phone", "restrictedCountryId", "restrictedFacilityId", "restrictedRegionId", "role", "teamId", "title") SELECT "accentColor", "avatarUrl", "createdAt", "csScope", "density", "email", "enterpriseAccountId", "id", "isActive", "mutedNotificationCategories", "name", "passwordHash", "phone", "restrictedCountryId", "restrictedFacilityId", "restrictedRegionId", "role", "teamId", "title" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
