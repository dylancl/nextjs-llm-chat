import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Only create database connection on server-side
let client: ReturnType<typeof createClient> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// Function to get or create database connection (server-side only)
export function getDatabase() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'Database connection should only be used on the server side'
    );
  }

  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL || 'file:./dev.db',
    });
    db = drizzle(client, { schema });
  }

  return db!;
}

export { schema };
export type Database = ReturnType<typeof getDatabase>;
