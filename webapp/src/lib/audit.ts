import { prisma } from "./prisma";

export async function logAudit(params: {
  actorId?: string | null;
  action: string;
  summary: string;
  targetType?: string;
  targetId?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId || null,
      action: params.action,
      summary: params.summary,
      targetType: params.targetType,
      targetId: params.targetId,
    },
  });
}
