import { prisma } from "./prisma";
import type { Density } from "./constants";

export type UserPreferences = {
  accentColor: string | null;
  density: Density;
  mutedCategories: string[];
  avatarUrl: string | null;
};

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accentColor: true, density: true, mutedNotificationCategories: true, avatarUrl: true },
  });
  return {
    accentColor: user?.accentColor ?? null,
    density: user?.density === "compact" ? "compact" : "comfortable",
    mutedCategories: user?.mutedNotificationCategories ? user.mutedNotificationCategories.split(",").filter(Boolean) : [],
    avatarUrl: user?.avatarUrl ?? null,
  };
}
