import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: (() => {
    // For development without Turso
    console.log(
      `Using database URL: ${
        process.env.TURSO_DATABASE_URL || 'file:./dev.db'
      }, isDevelopment: ${process.env.NODE_ENV === 'development'}`
    );
    if (process.env.NODE_ENV === 'development') {
      return {
        url: './dev.db',
      };
    }

    // For production or when Turso is explicitly configured
    return {
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    };
  })(),
});
