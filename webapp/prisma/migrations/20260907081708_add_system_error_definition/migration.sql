-- CreateTable
CREATE TABLE "SystemErrorDefinition" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fallbackMessage" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
