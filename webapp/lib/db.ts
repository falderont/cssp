import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Always connects as `cssp_app` (see prisma/rls.sql and .env.example) — a
// non-owner Postgres role with no BYPASSRLS, so every tenant-isolation policy
// actually applies to every query this client makes. Never point this at the
// migration/owner connection string.
const connectionString = process.env.APP_DATABASE_URL;
if (!connectionString) {
  throw new Error("APP_DATABASE_URL is not set — see .env.example");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
