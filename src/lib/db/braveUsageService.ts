import { eq, sql } from 'drizzle-orm';
import { getDatabase } from './index';
import { braveUsage } from './schema';

export interface BraveUsage {
  requestsThisMonth: number;
  monthlyLimit: number;
  requestsRemaining: number;
  lastReset: string;
  nextReset: string;
}

function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
}

function getNextMonthReset(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

async function initializeBraveUsage(): Promise<void> {
  const db = getDatabase();

  const existing = await db
    .select()
    .from(braveUsage)
    .where(eq(braveUsage.id, 1))
    .limit(1);

  if (existing.length === 0) {
    const monthStart = getMonthStart();
    await db.insert(braveUsage).values({
      id: 1,
      requestsThisMonth: 0,
      monthlyLimit: 2000,
      requestsRemaining: 2000,
      lastReset: monthStart,
      nextReset: getNextMonthReset(),
    });
  }
}

async function resetIfNewMonth(): Promise<void> {
  const db = getDatabase();
  const currentMonthStart = getMonthStart();

  const result = await db
    .select()
    .from(braveUsage)
    .where(eq(braveUsage.id, 1))
    .limit(1);
  if (result.length > 0 && result[0].lastReset !== currentMonthStart) {
    await db
      .update(braveUsage)
      .set({
        requestsThisMonth: 0,
        requestsRemaining: sql`${braveUsage.monthlyLimit}`,
        lastReset: currentMonthStart,
        nextReset: getNextMonthReset(),
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(braveUsage.id, 1));
  }
}

export async function getBraveUsage(): Promise<{
  monthlyLimit: BraveUsage;
  usage: BraveUsage;
}> {
  const db = getDatabase();
  await initializeBraveUsage();
  await resetIfNewMonth();

  const result = await db
    .select()
    .from(braveUsage)
    .where(eq(braveUsage.id, 1))
    .limit(1);
  const usage = result[0];

  const braveUsageData: BraveUsage = {
    requestsThisMonth: usage.requestsThisMonth,
    monthlyLimit: usage.monthlyLimit,
    requestsRemaining: usage.requestsRemaining,
    lastReset: usage.lastReset,
    nextReset: usage.nextReset,
  };

  return {
    monthlyLimit: braveUsageData,
    usage: braveUsageData,
  };
}

export async function recordBraveUsage(): Promise<
  | { success: boolean; monthlyLimit: BraveUsage; usage: BraveUsage }
  | { error: string; retryAfter: string; nextReset: string }
> {
  const db = getDatabase();
  await initializeBraveUsage();
  await resetIfNewMonth();

  const result = await db
    .select()
    .from(braveUsage)
    .where(eq(braveUsage.id, 1))
    .limit(1);
  const currentUsage = result[0];

  // Check if we have remaining requests
  if (currentUsage.requestsRemaining <= 0) {
    return {
      error: 'Monthly request limit exceeded',
      retryAfter: currentUsage.nextReset,
      nextReset: currentUsage.nextReset,
    };
  }

  // Record the usage
  await db
    .update(braveUsage)
    .set({
      requestsThisMonth: sql`${braveUsage.requestsThisMonth} + 1`,
      requestsRemaining: sql`CASE WHEN ${braveUsage.monthlyLimit} - (${braveUsage.requestsThisMonth} + 1) >= 0 THEN ${braveUsage.monthlyLimit} - (${braveUsage.requestsThisMonth} + 1) ELSE 0 END`,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(braveUsage.id, 1));

  const updatedResult = await getBraveUsage();
  return {
    success: true,
    monthlyLimit: updatedResult.monthlyLimit,
    usage: updatedResult.usage,
  };
}
