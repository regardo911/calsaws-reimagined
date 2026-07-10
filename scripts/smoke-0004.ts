// Smoke-check that migration 0004 applied — probes the _mig_0004_applied() marker
// (mirrors smoke-0003's clear_person probe).
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
config();

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const missing = (e: { message?: string; code?: string } | null) =>
  !!e && /does not exist|could not find|42883|PGRST202/i.test((e.message ?? '') + (e.code ?? ''));

(async () => {
  const { data, error } = await admin.rpc('_mig_0004_applied');
  if (missing(error)) { console.error('❌ _mig_0004_applied missing — 0004 NOT applied:', error?.message); process.exit(1); }
  if (error) { console.error('⚠️ unexpected error:', error.message); process.exit(1); }
  console.log(`✅ _mig_0004_applied → ${data} — migration 0004 is live.`);
  process.exit(0);
})();
