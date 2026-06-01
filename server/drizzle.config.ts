import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db.ts',
  out: '../drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  },
});
