"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ACCENT_COLOR_PRESETS, NOTIFICATION_CATEGORIES } from "@/lib/constants";

function refreshChrome() {
  revalidatePath("/portal", "layout");
  revalidatePath("/ops", "layout");
}

export async function updateAccentColor(color: string | null) {
  const user = await requireUser();
  const allowed = new Set<string>(ACCENT_COLOR_PRESETS.map((c) => c.value));
  const value = color && allowed.has(color) ? color : null;
  await prisma.user.update({ where: { id: user.id }, data: { accentColor: value } });
  refreshChrome();
}

export async function updateDensity(density: string) {
  const user = await requireUser();
  const value = density === "compact" ? "compact" : "comfortable";
  await prisma.user.update({ where: { id: user.id }, data: { density: value } });
  refreshChrome();
}

export async function toggleMutedCategory(category: string) {
  const user = await requireUser();
  if (!(NOTIFICATION_CATEGORIES as readonly string[]).includes(category)) return;
  const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: { mutedNotificationCategories: true } });
  const current = fresh?.mutedNotificationCategories ? fresh.mutedNotificationCategories.split(",").filter(Boolean) : [];
  const next = current.includes(category) ? current.filter((c) => c !== category) : [...current, category];
  await prisma.user.update({ where: { id: user.id }, data: { mutedNotificationCategories: next.join(",") } });
  refreshChrome();
}
