-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
INSERT INTO "new_User" ("avatarUrl", "createdAt", "csScope", "email", "enterpriseAccountId", "id", "isActive", "name", "passwordHash", "phone", "restrictedCountryId", "restrictedFacilityId", "restrictedRegionId", "role", "teamId", "title") SELECT "avatarUrl", "createdAt", "csScope", "email", "enterpriseAccountId", "id", "isActive", "name", "passwordHash", "phone", "restrictedCountryId", "restrictedFacilityId", "restrictedRegionId", "role", "teamId", "title" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
