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
import { isErrorCode } from "@/lib/errors";

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

// --- Error catalog ---------------------------------------------------------
// Global Sys Admin-editable copy behind the app-wide error pop-up/pages —
// see src/lib/errors.ts for the ErrorCode set and the fallback catalog these
// rows override.

const errorDefinitionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  fallbackMessage: z.string().min(1),
});

export async function updateErrorDefinition(code: string, formData: FormData) {
  const admin = await requireSysAdmin();
  if (!isErrorCode(code)) throw new Error("Unknown error code.");
  const parsed = errorDefinitionSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    fallbackMessage: formData.get("fallbackMessage"),
  });

  await prisma.systemErrorDefinition.upsert({
    where: { code },
    create: { code, ...parsed },
    update: parsed,
  });

  await logAudit({ actorId: admin.id, action: "error_catalog.update", summary: `Updated error catalog entry ${code}.`, targetType: "SystemErrorDefinition", targetId: code });
  revalidatePath("/ops/admin/error-catalog");
}

export async function resetErrorDefinition(code: string) {
  const admin = await requireSysAdmin();
  if (!isErrorCode(code)) throw new Error("Unknown error code.");
  await prisma.systemErrorDefinition.deleteMany({ where: { code } });
  await logAudit({ actorId: admin.id, action: "error_catalog.reset", summary: `Reset error catalog entry ${code} to its default copy.`, targetType: "SystemErrorDefinition", targetId: code });
  revalidatePath("/ops/admin/error-catalog");
}
