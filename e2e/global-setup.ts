// Reseed the database to the known baseline before the suite runs.
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { seedAll } from '../src/lib/seed-core';

export default async function globalSetup() {
  config({ path: '.env.local' }); config();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  await seedAll(admin);
  console.log('e2e: database reseeded to baseline');
}
