import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/auth-schema.ts',
  out: './drizzle-auth',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
