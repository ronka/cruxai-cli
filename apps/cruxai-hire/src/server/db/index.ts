import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type DbType = ReturnType<typeof drizzle<typeof schema>>;

let _db: DbType | undefined;

function getInstance(): DbType {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db: DbType = new Proxy({} as DbType, {
  get(_, prop) {
    return (getInstance() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export { schema };
