import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';
dotenv.config();

const TRANSIENT_DB_ERR_RE =
  /EPIPE|ECONNRESET|ETIMEDOUT|ECONNREFUSED|Connection terminated|connection error|terminating connection|57P01|08006|08003/i;

function isTransientDbError(err: any): boolean {
  const code = String(err?.code || err?.cause?.code || '');
  const msg = String(err?.message || '') + ' ' + String(err?.cause?.message || '');
  return TRANSIENT_DB_ERR_RE.test(code) || TRANSIENT_DB_ERR_RE.test(msg);
}

export const createPool = () => {
  const instance = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
  });

  const origQuery = instance.query.bind(instance) as (...args: any[]) => any;

  // Transparently retry queries that hit a stale/closed idle TCP socket (e.g. write EPIPE after idle wake)
  (instance as any).query = (...args: any[]) => {
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'function') {
      return origQuery(...args);
    }
    const execWithRetry = async (attempt: number): Promise<any> => {
      try {
        return await origQuery(...args);
      } catch (err: any) {
        if (attempt < 3 && isTransientDbError(err)) {
          await new Promise((r) => setTimeout(r, 150 * attempt));
          return execWithRetry(attempt + 1);
        }
        throw err;
      }
    };
    return execWithRetry(1);
  };

  return instance;
};

export const pool = createPool();

pool.on('error', (err) => {
  // Prevent unhandled error event from crashing process when an idle client disconnects
  console.warn('Idle SQL pool client notice:', err?.message || err);
});

export const db = drizzle(pool, { schema });
