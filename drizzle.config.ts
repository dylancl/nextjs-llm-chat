import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url:
      process.env.TURSO_DATABASE_URL ||
      process.env.DATABASE_URL ||
      './local.db',
    token: process.env.TURSO_AUTH_TOKEN || undefined,
  },
});
