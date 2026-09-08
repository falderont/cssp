"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function markAllNotificationsRead(returnPath: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  revalidatePath(returnPath);
}

export async function markNotificationRead(id: string, returnPath: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { isRead: true } });
  revalidatePath(returnPath);
}

// Used by the notifications balloon in the topbar, which can be opened from
// any page — revalidates both chrome trees instead of one specific path.
export async function markNotificationReadInline(id: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { isRead: true } });
  revalidatePath("/portal", "layout");
  revalidatePath("/ops", "layout");
}

export async function markAllNotificationsReadInline() {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/portal", "layout");
  revalidatePath("/ops", "layout");
}
