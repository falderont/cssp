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

  const [tickets, tasks, engagementCounts] = await Promise.all([
    prisma.ticket.findMany({ where: { assignedToId: { not: null }, status: "Done" } }),
    prisma.remoteHandsTask.findMany({ where: { assignedTechnicianId: { not: null }, status: "Completed" } }),
    prisma.engagementLog.groupBy({ by: ["repId"], _count: { _all: true } }),
  ]);

  const engagementMap = new Map(engagementCounts.map((e) => [e.repId, e._count._all]));

  return staff.map((user) => {
    const userTickets = tickets.filter((t) => t.assignedToId === user.id);
    const userTasks = tasks.filter((t) => t.assignedTechnicianId === user.id);

    const resolutionHours: number[] = [];
    for (const t of userTickets) {
      if (t.resolvedAt) resolutionHours.push((t.resolvedAt.getTime() - t.createdAt.getTime()) / 3_600_000);
    }
    for (const t of userTasks) {
      if (t.completedAt) resolutionHours.push((t.completedAt.getTime() - t.createdAt.getTime()) / 3_600_000);
    }

    const ratings: number[] = [];
    for (const t of userTickets) if (t.csatRating) ratings.push(t.csatRating === "up" ? 5 : 1);
    for (const t of userTasks) if (t.csatRating) ratings.push(t.csatRating === "up" ? 5 : 1);

    return {
      userId: user.id,
      name: user.name,
      role: user.role,
      resolvedCount: userTickets.length + userTasks.length,
      avgResolutionHrs: resolutionHours.length ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length : null,
      touchpoints: engagementMap.get(user.id) ?? 0,
      avgCsat: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    };
  });
}
