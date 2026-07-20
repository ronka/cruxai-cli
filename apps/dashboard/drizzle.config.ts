import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config. Migrations are committed under `drizzle/` and applied at
 * runtime by `lib/db.ts`; `pnpm db:generate` regenerates them from `schema.ts`.
 * `pnpm db:push` pushes the schema straight into `CRUX_DATA_DIR/crux.db`.
 */
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.CRUX_DATA_DIR
      ? `${process.env.CRUX_DATA_DIR}/crux.db`
      : './crux-data/crux.db',
  },
});
