import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

// Support Neon Serverless PostgreSQL and local PostgreSQL seamlessly
const isNeonOrCloud = connectionString?.includes('neon.tech') || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  ssl: isNeonOrCloud ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export const db = {
  query: (text: string, params?: any[]): Promise<QueryResult> => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};

export default db;
