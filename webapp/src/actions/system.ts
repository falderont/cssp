"use server";

import { z } from "zod";
import path from "path";
import { readFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSysAdmin } from "@/lib/session";
import { saveGeneratedFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { CURRENCIES, SYSTEM_INTEGRATION_STATUSES, TIMEZONES } from "@/lib/constants";

// --- System integrations ------------------------------------------------------

const integrationSchema = z.object({
  status: z.enum(SYSTEM_INTEGRATION_STATUSES),
  configJson: z.string().optional(),
});

export async function updateSystemIntegration(key: string, formData: FormData) {
  const admin = await requireSysAdmin();
  const parsed = integrationSchema.parse({
    status: formData.get("status"),
    configJson: formData.get("configJson") || undefined,
  });

  await prisma.systemIntegration.update({
    where: { key },
    data: {
      status: parsed.status,
      configJson: parsed.configJson || null,
      lastSyncAt: parsed.status === "Connected" ? new Date() : undefined,
    },
  });

  await logAudit({ actorId: admin.id, action: "integration.update", summary: `Set ${key} integration status to ${parsed.status}.`, targetType: "SystemIntegration", targetId: key });
  revalidatePath("/ops/admin/integrations");
}

// --- Global preferences --------------------------------------------------------

const preferencesSchema = z.object({
  defaultCurrency: z.enum(CURRENCIES),
  defaultTimezone: z.enum(TIMEZONES),
  sessionTimeoutMinutes: z.coerce.number().int().min(5).max(1440),
});

export async function updateGlobalPreferences(formData: FormData) {
  const admin = await requireSysAdmin();
  const parsed = preferencesSchema.parse({
    defaultCurrency: formData.get("defaultCurrency"),
    defaultTimezone: formData.get("defaultTimezone"),
    sessionTimeoutMinutes: formData.get("sessionTimeoutMinutes"),
  });

  await prisma.providerSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      companyName: "CSSP Colocation",
      supportEmail: "support@example.com",
      supportPhone: "+1 000 000 0000",
      ...parsed,
    },
    update: parsed,
  });

  await logAudit({ actorId: admin.id, action: "preferences.update", summary: "Updated global preferences." });
  revalidatePath("/ops/admin/preferences");
}

const maintenanceSchema = z.object({
  maintenanceMode: z.coerce.boolean(),
  maintenanceMessage: z.string().optional(),
});

export async function updateMaintenanceMode(formData: FormData) {
  const admin = await requireSysAdmin();
  const parsed = maintenanceSchema.parse({
    maintenanceMode: formData.get("maintenanceMode") === "on",
    maintenanceMessage: formData.get("maintenanceMessage") || undefined,
  });

  await prisma.providerSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      companyName: "CSSP Colocation",
      supportEmail: "support@example.com",
      supportPhone: "+1 000 000 0000",
      ...parsed,
      maintenanceMessage: parsed.maintenanceMessage || null,
    },
    update: { ...parsed, maintenanceMessage: parsed.maintenanceMessage || null },
  });

  await logAudit({
    actorId: admin.id,
    action: "maintenance.update",
    summary: `Maintenance mode turned ${parsed.maintenanceMode ? "ON" : "off"}.`,
  });
  revalidatePath("/ops/admin/backup");
  revalidatePath("/", "layout");
}

// --- Backup & maintenance -------------------------------------------------------

export async function createBackup() {
  const admin = await requireSysAdmin();
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const buffer = await readFile(dbPath);
  const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.db`;
  const storageKey = await saveGeneratedFile(buffer, `backups/${fileName}`);

  await prisma.backupRecord.create({
    data: {
      fileName,
      storageKey,
      fileSizeKb: Math.max(1, Math.round(buffer.byteLength / 1024)),
      createdById: admin.id,
    },
  });

  await logAudit({ actorId: admin.id, action: "backup.create", summary: `Created database backup ${fileName}.` });
  revalidatePath("/ops/admin/backup");
}
