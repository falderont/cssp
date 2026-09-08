/*
  Warnings:

  - Made the column `enterpriseAccountId` on table `Delivery` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityId" TEXT NOT NULL,
    "enterpriseAccountId" TEXT NOT NULL,
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
    CONSTRAINT "Delivery_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "EnterpriseAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Delivery_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Delivery_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Delivery" ("arrivedAt", "courierName", "createdAt", "createdById", "description", "enterpriseAccountId", "expectedAt", "facilityId", "id", "notes", "receivedAt", "receivedById", "recipientName", "status", "trackingNumber") SELECT "arrivedAt", "courierName", "createdAt", "createdById", "description", "enterpriseAccountId", "expectedAt", "facilityId", "id", "notes", "receivedAt", "receivedById", "recipientName", "status", "trackingNumber" FROM "Delivery";
DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
