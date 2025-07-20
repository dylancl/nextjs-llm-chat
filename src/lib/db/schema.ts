import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const bonzaiUsage = sqliteTable('bonzai_usage', {
  id: integer('id').primaryKey().notNull(),
  totalRequests: integer('total_requests').notNull().default(0),
  totalInputTokens: integer('total_input_tokens').notNull().default(0),
  totalOutputTokens: integer('total_output_tokens').notNull().default(0),
  requestsToday: integer('requests_today').notNull().default(0),
  inputTokensToday: integer('input_tokens_today').notNull().default(0),
  outputTokensToday: integer('output_tokens_today').notNull().default(0),
  lastReset: text('last_reset')
    .notNull()
    .default(sql`(date('now'))`),
  nextReset: text('next_reset').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const braveUsage = sqliteTable('brave_usage', {
  id: integer('id').primaryKey().notNull(),
  requestsThisMonth: integer('requests_this_month').notNull().default(0),
  monthlyLimit: integer('monthly_limit').notNull().default(2000),
  requestsRemaining: integer('requests_remaining').notNull().default(2000),
  lastReset: text('last_reset')
    .notNull()
    .default(sql`(date('now', 'start of month'))`),
  nextReset: text('next_reset').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey().notNull(),
  title: text('title').notNull(),
  messages: text('messages').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now', 'utc') || 'Z')`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now', 'utc') || 'Z')`),
});

export type BonzaiUsageSelect = typeof bonzaiUsage.$inferSelect;
export type BonzaiUsageInsert = typeof bonzaiUsage.$inferInsert;
export type BraveUsageSelect = typeof braveUsage.$inferSelect;
export type BraveUsageInsert = typeof braveUsage.$inferInsert;
export type ConversationSelect = typeof conversations.$inferSelect;
export type ConversationInsert = typeof conversations.$inferInsert;
