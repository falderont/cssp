import { prisma } from "./prisma";
import { ROLES } from "./constants";

export type RepPerformance = {
  userId: string;
  name: string;
  role: string;
  resolvedCount: number;
  avgResolutionHrs: number | null;
  touchpoints: number;
  avgCsat: number | null;
};

export async function getTeamPerformance(): Promise<RepPerformance[]> {
  const staff = await prisma.user.findMany({
    where: {
      role: { in: [ROLES.PROVIDER_CS, ROLES.PROVIDER_CS_MANAGER, ROLES.PROVIDER_OPS, ROLES.PROVIDER_TECHNICIAN] },
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  const [requests, engagementCounts] = await Promise.all([
    prisma.serviceRequest.findMany({ where: { assignedToId: { not: null }, status: "Done" } }),
    prisma.engagementLog.groupBy({ by: ["repId"], _count: { _all: true } }),
  ]);

  const engagementMap = new Map(engagementCounts.map((e) => [e.repId, e._count._all]));

  return staff.map((user) => {
    const userRequests = requests.filter((r) => r.assignedToId === user.id);

    const resolutionHours: number[] = [];
    for (const r of userRequests) {
      const finishedAt = r.completedAt ?? r.resolvedAt;
      if (finishedAt) resolutionHours.push((finishedAt.getTime() - r.createdAt.getTime()) / 3_600_000);
    }

    const ratings: number[] = [];
    for (const r of userRequests) if (r.csatRating) ratings.push(r.csatRating === "up" ? 5 : 1);

    return {
      userId: user.id,
      name: user.name,
      role: user.role,
      resolvedCount: userRequests.length,
      avgResolutionHrs: resolutionHours.length ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length : null,
      touchpoints: engagementMap.get(user.id) ?? 0,
      avgCsat: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    };
  });
}
