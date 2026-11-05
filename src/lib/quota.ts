import { prisma } from './db';

// Default daily limit of AI generations per user
const DEFAULT_DAILY_LIMIT = 50;

/**
 * Checks if the user has reached their daily AI usage limit.
 */
export async function checkAiQuota(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const usageCount = await prisma.aiUsageLog.count({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  const remaining = Math.max(0, DEFAULT_DAILY_LIMIT - usageCount);
  return {
    allowed: usageCount < DEFAULT_DAILY_LIMIT,
    currentCount: usageCount,
    limit: DEFAULT_DAILY_LIMIT,
    remaining,
  };
}

/**
 * Records AI usage event for audit and rate-limiting.
 */
export async function logAiUsage(params: {
  userId: string;
  actionType: string;
  inputTokens?: number;
  outputTokens?: number;
}): Promise<void> {
  try {
    await prisma.aiUsageLog.create({
      data: {
        userId: params.userId,
        actionType: params.actionType,
        inputTokens: params.inputTokens ?? 0,
        outputTokens: params.outputTokens ?? 0,
      },
    });
  } catch (err) {
    console.error('Failed to log AI usage:', err);
  }
}

/**
 * Records general audit log (e.g. login, delete, export).
 */
export async function recordAuditLog(params: {
  userId: string;
  action: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        metadata: params.metadata as any,
      },
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
