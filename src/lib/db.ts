import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not configured. Add it to .env.local and restart `npm run dev`.'
  );
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // required for Supabase
});

export default pool;
