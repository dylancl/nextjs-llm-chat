import { eq, sql } from 'drizzle-orm';
import { getDatabase } from './index';
import { bonzaiUsage } from './schema';

export interface BonzaiUsage {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestsToday: number;
  inputTokensToday: number;
  outputTokensToday: number;
  lastReset: string;
  nextReset: string;
}

function getNextReset(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

async function initializeBonzaiUsage(): Promise<void> {
  const db = getDatabase();
  const existing = await db
    .select()
    .from(bonzaiUsage)
    .where(eq(bonzaiUsage.id, 1))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(bonzaiUsage).values({
      id: 1,
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      requestsToday: 0,
      inputTokensToday: 0,
      outputTokensToday: 0,
      lastReset: getTodayDate(),
      nextReset: getNextReset(),
    });
  }
}

async function resetIfNewDay(): Promise<void> {
  const db = getDatabase();
  const today = getTodayDate();

  await db
    .update(bonzaiUsage)
    .set({
      requestsToday: 0,
      inputTokensToday: 0,
      outputTokensToday: 0,
      lastReset: today,
      nextReset: getNextReset(),
      updatedAt: sql`(datetime('now'))`,
    })
    .where(sql`${bonzaiUsage.lastReset} != ${today}`);
}

export async function getBonzaiUsage(): Promise<BonzaiUsage> {
  await initializeBonzaiUsage();
  await resetIfNewDay();

  const db = getDatabase();

  const result = await db
    .select()
    .from(bonzaiUsage)
    .where(eq(bonzaiUsage.id, 1))
    .limit(1);

  const usage = result[0];

  return {
    totalRequests: usage.totalRequests,
    totalInputTokens: usage.totalInputTokens,
    totalOutputTokens: usage.totalOutputTokens,
    requestsToday: usage.requestsToday,
    inputTokensToday: usage.inputTokensToday,
    outputTokensToday: usage.outputTokensToday,
    lastReset: usage.lastReset,
    nextReset: usage.nextReset,
  };
}

export async function recordBonzaiUsage(
  inputTokens: number = 0,
  outputTokens: number = 0
): Promise<BonzaiUsage> {
  await initializeBonzaiUsage();
  await resetIfNewDay();

  const db = getDatabase();

  await db
    .update(bonzaiUsage)
    .set({
      totalRequests: sql`${bonzaiUsage.totalRequests} + 1`,
      requestsToday: sql`${bonzaiUsage.requestsToday} + 1`,
      totalInputTokens: sql`${bonzaiUsage.totalInputTokens} + ${inputTokens}`,
      totalOutputTokens: sql`${bonzaiUsage.totalOutputTokens} + ${outputTokens}`,
      inputTokensToday: sql`${bonzaiUsage.inputTokensToday} + ${inputTokens}`,
      outputTokensToday: sql`${bonzaiUsage.outputTokensToday} + ${outputTokens}`,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(bonzaiUsage.id, 1));

  return getBonzaiUsage();
}
