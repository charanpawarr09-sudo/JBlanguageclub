import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';

let pool: pg.Pool | null = null;
let db: NodePgDatabase<typeof schema> = null as any;

try {
    if (connectionString) {
        pool = new pg.Pool({
            connectionString,
            max: 20,
        });
        db = drizzle(pool, { schema });
    } else {
        console.warn('⚠️  No DATABASE_URL — database operations will fail gracefully');
        // Create a minimal dummy so imports don't crash
        pool = null;
        db = null as any;
    }
} catch (err) {
    console.warn('⚠️  Failed to initialize database pool:', String(err));
    pool = null;
    db = null as any;
}

export { db, pool };
