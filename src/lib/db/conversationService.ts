import { getDatabase, schema } from './index';
import { eq, desc } from 'drizzle-orm';
import { Message } from '@/hooks/useMessages';

/**
 * Normalizes a timestamp from the database to ensure consistent ISO format
 */
function normalizeTimestamp(timestamp: string): string {
  // If it's already an ISO string with Z, return as-is
  if (
    timestamp.endsWith('Z') ||
    (timestamp.includes('T') && timestamp.includes('+'))
  ) {
    return timestamp;
  }

  // If it's SQLite datetime format, convert to ISO
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)) {
    return timestamp.replace(' ', 'T') + 'Z';
  }

  // Try to parse and convert to ISO
  try {
    return new Date(timestamp).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Safely converts a timestamp to a Date object
 * Handles both string and Date inputs, and normalizes SQLite datetime format
 */
function ensureTimestampIsDate(timestamp: string | Date | number): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    let dateString = timestamp.toString();

    // If it's an SQLite datetime format without timezone, treat it as UTC
    if (
      typeof timestamp === 'string' &&
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)
    ) {
      dateString = timestamp + 'Z';
    }

    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  // Fallback for invalid timestamps
  return new Date();
}

export interface ConversationWithMessages {
  id: number;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export class ConversationService {
  static async createConversation(
    title: string,
    messages: Message[]
  ): Promise<number> {
    const db = getDatabase();
    const now = new Date().toISOString(); // Use consistent ISO string
    const result = await db
      .insert(schema.conversations)
      .values({
        title,
        messages: JSON.stringify(messages),
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: schema.conversations.id });

    return result[0].id;
  }

  static async updateConversation(
    id: number,
    messages: Message[]
  ): Promise<void> {
    const db = getDatabase();
    await db
      .update(schema.conversations)
      .set({
        messages: JSON.stringify(messages),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.conversations.id, id));
  }

  static async updateConversationTitle(
    id: number,
    title: string
  ): Promise<void> {
    const db = getDatabase();
    await db
      .update(schema.conversations)
      .set({
        title,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.conversations.id, id));
  }

  static async getConversation(
    id: number
  ): Promise<ConversationWithMessages | null> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const conversation = result[0];
    const parsedMessages = JSON.parse(conversation.messages) as Message[];

    // Convert timestamp strings back to Date objects
    const messagesWithDates = parsedMessages.map((msg) => ({
      ...msg,
      timestamp: ensureTimestampIsDate(msg.timestamp),
    }));

    return {
      ...conversation,
      messages: messagesWithDates,
      createdAt: normalizeTimestamp(conversation.createdAt),
      updatedAt: normalizeTimestamp(conversation.updatedAt),
    };
  }

  static async getAllConversations(): Promise<ConversationWithMessages[]> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.conversations)
      .orderBy(desc(schema.conversations.updatedAt));

    return result.map((conversation) => {
      const parsedMessages = JSON.parse(conversation.messages) as Message[];

      // Convert timestamp strings back to Date objects
      const messagesWithDates = parsedMessages.map((msg) => ({
        ...msg,
        timestamp: ensureTimestampIsDate(msg.timestamp),
      }));

      return {
        ...conversation,
        messages: messagesWithDates,
        createdAt: normalizeTimestamp(conversation.createdAt),
        updatedAt: normalizeTimestamp(conversation.updatedAt),
      };
    });
  }

  static async deleteConversation(id: number): Promise<void> {
    const db = getDatabase();
    await db
      .delete(schema.conversations)
      .where(eq(schema.conversations.id, id));
  }

  static async getConversationPreviews(limit = 20): Promise<
    Array<{
      id: number;
      title: string;
      createdAt: string;
      updatedAt: string;
      messageCount: number;
      lastUserMessage?: string;
    }>
  > {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.conversations)
      .orderBy(desc(schema.conversations.updatedAt))
      .limit(limit);

    return result.map((conversation) => {
      const messages = JSON.parse(conversation.messages) as Message[];
      // Note: For previews, we don't need to convert timestamps as we only use content
      const lastUserMessage = messages
        .filter((m) => m.role === 'user')
        .pop()?.content;

      return {
        id: conversation.id,
        title: conversation.title,
        createdAt: normalizeTimestamp(conversation.createdAt),
        updatedAt: normalizeTimestamp(conversation.updatedAt),
        messageCount: messages.length,
        lastUserMessage:
          lastUserMessage?.slice(0, 100) +
          (lastUserMessage && lastUserMessage.length > 100 ? '...' : ''),
      };
    });
  }
}
