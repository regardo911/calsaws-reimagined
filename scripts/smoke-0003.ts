// Smoke-check that migration 0003 applied end-to-end (service-role, no RLS).
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, { auth: { persistSession: false } });

const missing = (e: { message?: string; code?: string } | null) =>
  !!e && /does not exist|could not find|42883|PGRST202/i.test((e.message ?? '') + (e.code ?? ''));

(async () => {
  // clear_person is the LAST statement in 0003 — its presence proves the file ran through the end,
  // and it transitively depends on is_staff()/my_role() created earlier.
  const { error } = await admin.rpc('clear_person', { q: 'zzz-none' });
  if (missing(error)) { console.error('❌ clear_person missing — 0003 NOT fully applied:', error?.message); process.exit(1); }
  if (error) { console.error('⚠️ clear_person unexpected error:', error.message); process.exit(1); }
  console.log('✅ clear_person present — migration 0003 applied through its final statement.');
  process.exit(0);
})();
