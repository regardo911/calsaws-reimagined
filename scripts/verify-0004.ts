// Functional red/green verification for migration 0004 (BUG-001 + BUG-002).
// Signs in as REAL demo users (worker + supervisor) so the SECURITY DEFINER RPCs
// run with a genuine auth.uid() / my_role() / my_county(), exactly like the app.
// Mutates only synthetic seed data, then reseeds to pristine.
//
//   npm run verify:0004        (RED before 0004 is applied, GREEN after)
import { config } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ROSTER, DEMO_PASSWORD, seedAll } from '../src/lib/seed-core';

config({ path: '.env.local' });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, svcKey, { auth: { autoRefreshToken: false, persistSession: false } });

const COUNTY = 'San Diego';
const workerEmail = ROSTER.find(a => a.role === 'worker' && a.county === COUNTY)!.email;
const supEmail = ROSTER.find(a => a.role === 'supervisor' && a.county === COUNTY)!.email;

// PG `date + int` = calendar-day add, tz-independent. Mirror it in UTC.
function addDaysUTC(iso: string, n: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`); }
}

async function asUser(email: string): Promise<SupabaseClient> {
  const c = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
  if (error) throw new Error(`sign-in ${email}: ${error.message}`);
  return c;
}

async function profileId(role: string, county: string): Promise<string> {
  const { data, error } = await admin.from('profiles').select('id').eq('role', role).eq('county', county).limit(1).single();
  if (error) throw new Error(`profile ${role}/${county}: ${error.message}`);
  return data.id as string;
}

(async () => {
  console.log(`\n▶ verify-0004 against ${url}  (county: ${COUNTY})\n`);
  const supId = await profileId('supervisor', COUNTY);

  const worker = await asUser(workerEmail);
  const supervisor = await asUser(supEmail);

  // ---------------------------------------------------------------------------
  // Scenario A — BUG-001 (auth task created) + BUG-002 (return preserves 30-day clock)
  // ---------------------------------------------------------------------------
  console.log('Scenario A · CalWORKs routing → authorization task → return (regular case)');
  const { data: aCase, error: aErr } = await admin.from('cases')
    .select('id, case_number, application_date, expedited, assigned_to')
    .eq('county', COUNTY).eq('status', 'pending').eq('expedited', false).limit(1).single();
  if (aErr || !aCase) throw new Error(`no pending ${COUNTY} case to drive: ${aErr?.message}`);
  const appDate = (aCase.application_date as string).slice(0, 10);

  // stage an un-accepted EDBC run with a CW-eligible result (drives the CW branch)
  const { data: run, error: rErr } = await admin.from('edbc_runs')
    .insert({ case_id: aCase.id, benefit_month: appDate.slice(0, 7), run_by: aCase.assigned_to, accepted: false })
    .select('id').single();
  if (rErr) throw new Error(`stage run: ${rErr.message}`);
  await admin.from('edbc_results').insert([
    { run_id: run.id, program: 'CW', status: 'Eligible', amount: 600, aid_code: '30' },
    { run_id: run.id, program: 'CF', status: 'Eligible', amount: 291, aid_code: '09' },
    { run_id: run.id, program: 'MC', status: 'Eligible', amount: 0 },
  ]);

  const acc = await worker.rpc('accept_edbc_run', { p_run_id: run.id });
  check('worker accept routes to pending_authorization', acc.data === 'pending_authorization', `got ${JSON.stringify(acc.data)} err=${acc.error?.message}`);

  const { data: authTasks } = await admin.from('tasks')
    .select('*').eq('case_id', aCase.id).eq('status', 'open').eq('type', 'Authorize CalWORKs grant');
  const at = (authTasks ?? [])[0];
  check('BUG-001: authorization task was created', !!at, 'no open "Authorize CalWORKs grant" task');
  check('BUG-001: task assigned to in-county supervisor', at?.assigned_to === supId, `assigned_to=${at?.assigned_to} expected=${supId}`);
  check('BUG-001: task carries an SLA due date on the case clock', at?.due_date === addDaysUTC(appDate, 30), `due=${at?.due_date} expected=${addDaysUTC(appDate, 30)}`);

  // supervisor returns the case to the worker
  const ret = await supervisor.rpc('authorize_case', { p_case_id: aCase.id, p_approve: false });
  check('supervisor return sets case back to pending', ret.data === 'pending', `got ${JSON.stringify(ret.data)} err=${ret.error?.message}`);

  let afterAuthStatus: string | undefined;
  if (at?.id) { const { data } = await admin.from('tasks').select('status').eq('id', at.id).single(); afterAuthStatus = data?.status as string | undefined; }
  check('return closes the now-moot authorization task', afterAuthStatus === 'done', `status=${afterAuthStatus}`);

  const { data: workerTasks } = await admin.from('tasks')
    .select('*').eq('case_id', aCase.id).eq('status', 'open');
  const wt = (workerTasks ?? [])[0];
  check('BUG-002: a worker task is re-opened on return', !!wt, 'no re-opened worker task');
  check('BUG-002: returned task preserves the ORIGINAL 30-day clock (not current_date+5)',
    wt?.due_date === addDaysUTC(appDate, 30), `due=${wt?.due_date} expected=${addDaysUTC(appDate, 30)} (buggy would be ~${addDaysUTC(new Date().toISOString(), 5)})`);

  // ---------------------------------------------------------------------------
  // Scenario B — BUG-002 expedited: a returned EXPEDITED case keeps its 3-day clock
  // ---------------------------------------------------------------------------
  console.log('\nScenario B · return preserves the EXPEDITED 3-day clock');
  const { data: bCase, error: bErr } = await admin.from('cases')
    .select('id, case_number, application_date, assigned_to')
    .eq('county', COUNTY).eq('expedited', true).limit(1).single();
  if (bErr || !bCase) throw new Error(`no expedited ${COUNTY} case: ${bErr?.message}`);
  const bAppDate = (bCase.application_date as string).slice(0, 10);

  // stage it as accepted + awaiting authorization (expedited already true)
  const { data: bRun } = await admin.from('edbc_runs')
    .insert({ case_id: bCase.id, benefit_month: bAppDate.slice(0, 7), run_by: bCase.assigned_to, accepted: true, accepted_by: bCase.assigned_to, accepted_at: new Date().toISOString() })
    .select('id').single();
  await admin.from('edbc_results').insert([{ run_id: bRun!.id, program: 'CF', status: 'Eligible', amount: 200, expedited: true, aid_code: '09' }]);
  await admin.from('cases').update({ status: 'pending_authorization' }).eq('id', bCase.id);
  // mimic accept_edbc_run: the worker's task is already closed by the time a case
  // awaits authorization, so the only open task after a return is the new one.
  await admin.from('tasks').update({ status: 'done' }).eq('case_id', bCase.id).eq('status', 'open');

  const retB = await supervisor.rpc('authorize_case', { p_case_id: bCase.id, p_approve: false });
  check('supervisor return sets expedited case back to pending', retB.data === 'pending', `got ${JSON.stringify(retB.data)} err=${retB.error?.message}`);

  const { data: bTasks } = await admin.from('tasks').select('*').eq('case_id', bCase.id).eq('status', 'open');
  check('exactly one open task after expedited return', (bTasks ?? []).length === 1, `open count=${(bTasks ?? []).length}`);
  const bt = (bTasks ?? [])[0];
  check('BUG-002: expedited return keeps the 3-day deadline', bt?.due_date === addDaysUTC(bAppDate, 3), `due=${bt?.due_date} expected=${addDaysUTC(bAppDate, 3)}`);
  check('BUG-002: expedited return is Critical priority', bt?.priority === 'Critical', `priority=${bt?.priority}`);

  // ---------------------------------------------------------------------------
  console.log('\n↻ restoring pristine demo state (seedAll)…');
  await seedAll(admin);
  console.log('   reseed complete.');

  console.log(`\n${fail === 0 ? '✅ GREEN' : '❌ RED'} — ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error('\n💥 verify-0004 crashed:', e.message);
  try { await seedAll(admin); console.error('   (reseeded after crash)'); } catch { /* noop */ }
  process.exit(1);
});
