// CLI seeder: npm run db:seed  (requires .env.local with service-role key)
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { seedAll } from '../src/lib/seed-core';

config({ path: '.env.local' });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

seedAll(admin, { push: (m) => console.log('•', m) })
  .then((r) => { console.log(`\nSeed complete: ${r.cases} cases.`); process.exit(0); })
  .catch((e) => { console.error('SEED FAILED:', e.message); process.exit(1); });
