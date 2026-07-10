// Apply a .sql file to the live DB over the session pooler (role postgres) — the
// local replacement for pasting migrations into the Supabase SQL Editor.
//   npm run db:apply -- supabase/migrations/0004_workflow_fixes.sql
// Reads the DB password from .dbpass.local; derives the project ref from the URL.
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { Client } from 'pg';

config({ path: '.env.local' });
config();

const file = process.argv[2];
if (!file) { console.error('usage: db:apply -- <path-to.sql>'); process.exit(1); }

const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').match(/https:\/\/([a-z0-9]+)\.supabase/)?.[1];
if (!ref) { console.error('cannot derive project ref from NEXT_PUBLIC_SUPABASE_URL'); process.exit(1); }
const password = readFileSync('.dbpass.local', 'utf8').trim();
const sql = readFileSync(file, 'utf8');

const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',   // session pooler (:5432 supports DDL)
  port: 5432,
  user: `postgres.${ref}`,
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  statement_timeout: 60_000,
});

(async () => {
  await client.connect();
  console.log(`▶ applying ${file} as postgres.${ref} …`);
  await client.query(sql);            // simple-query protocol runs the whole file
  console.log('✅ applied.');
  await client.end();
  process.exit(0);
})().catch(async (e) => {
  console.error('❌ apply failed:', e.message);
  try { await client.end(); } catch { /* noop */ }
  process.exit(1);
});
