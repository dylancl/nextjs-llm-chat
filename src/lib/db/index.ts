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
    // Check if we're in development mode and no Turso URL is provided
    const isDevelopment = process.env.NODE_ENV === 'development';
    const tursoUrl = process.env.TURSO_DATABASE_URL;

    console.log(
      `Initializing database connection. Development mode: ${isDevelopment}, Turso URL: ${tursoUrl}`
    );

    if (isDevelopment && !tursoUrl) {
      // Use local SQLite file for development
      client = createClient({
        url: 'file:./dev.db',
      });
    } else {
      // Use Turso for production or when explicitly configured
      client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });
    }

    db = drizzle(client, { schema });
  }

  return db!;
}

export { schema };
export type Database = ReturnType<typeof getDatabase>;
