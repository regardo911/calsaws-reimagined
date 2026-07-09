// ============================================================================
// County-scoped RLS isolation suite (migration 0003).
// Worker + supervisor see ONLY their own county; admin sees all; the SECURITY
// DEFINER workflow RPCs enforce county internally; new applications route to an
// in-county worker. DB-level checks via RLS-scoped anon sessions (like scenario 4).
// Runs after global-setup reseeds the 12-county roster.
// ============================================================================
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { PASSWORD } from './helpers';

config({ path: '.env.local' });
config();
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SD_WORKER = 'worker.sandiego@demo.calsaws.test';
const SD_SUPERVISOR = 'supervisor.sandiego@demo.calsaws.test';
const SD_APPLICANT = 'applicant.sandiego@demo.calsaws.test';
const LA_WORKER = 'worker.dana@demo.calsaws.test';
const ADMIN = 'admin.chris@demo.calsaws.test';

const svc = () => createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } });
async function asUser(email: string) {
  const c = createClient(SB_URL, SB_ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  expect(error, `sign in ${email}`).toBeNull();
  return c;
}

test('county: worker sees only their own county cases', async () => {
  const sd = await asUser(SD_WORKER);
  const { data: cases } = await sd.from('cases').select('case_number, county');
  expect((cases ?? []).length).toBeGreaterThan(0);
  expect((cases ?? []).every(c => c.county === 'San Diego')).toBe(true);
  // LA golden case is invisible to the SD worker
  expect((cases ?? []).some(c => c.case_number === 'C-100001')).toBe(false);
  const { data: laDirect } = await sd.from('cases').select('id').eq('case_number', 'C-100001');
  expect(laDirect ?? []).toHaveLength(0);
});

test('county: worker cannot read another county case graph or tasks', async () => {
  const admin = svc();
  const { data: la } = await admin.from('cases').select('id').eq('case_number', 'C-100001').single();
  const laId = la!.id as string;

  const sd = await asUser(SD_WORKER);
  for (const tbl of ['persons', 'income_records', 'edbc_runs', 'notices', 'issuances', 'journal_entries', 'data_matches', 'tasks']) {
    const { data } = await sd.from(tbl).select('*').eq('case_id', laId);
    expect(data ?? [], `${tbl} for LA case leaked to SD worker`).toHaveLength(0);
  }
  // every task the SD worker can see belongs to a San Diego case
  const { data: tasks } = await sd.from('tasks').select('case_id, cases(county)');
  expect((tasks ?? []).every((t: any) => {
    const c = t.cases;
    const county = Array.isArray(c) ? c[0]?.county : c?.county;
    return county === 'San Diego';
  })).toBe(true);
});

test('county: DEFINER workflow RPCs reject cross-county actions', async () => {
  const admin = svc();
  // an LA edbc run + an LA unresolved data match
  const { data: laRun } = await admin.from('edbc_runs').select('id, cases!inner(county)').eq('cases.county', 'Los Angeles').limit(1).single();
  const { data: laMatch } = await admin.from('data_matches').select('id, cases!inner(county)').eq('cases.county', 'Los Angeles').eq('resolved', false).limit(1).single();

  const sd = await asUser(SD_WORKER);
  const r1 = await sd.rpc('accept_edbc_run', { p_run_id: laRun!.id });
  expect(r1.error?.message ?? '').toMatch(/cross-county/i);

  if (laMatch?.id) {
    const r2 = await sd.rpc('resolve_data_match', { p_match_id: laMatch.id, p_use_matched: true, p_note: null });
    expect(r2.error?.message ?? '').toMatch(/cross-county/i);
  }

  // an LA case pending authorization → SD supervisor cannot authorize it
  const { data: laAuth } = await admin.from('cases').select('id').eq('county', 'Los Angeles').eq('status', 'pending_authorization').limit(1).maybeSingle();
  if (laAuth?.id) {
    const sup = await asUser(SD_SUPERVISOR);
    const r3 = await sup.rpc('authorize_case', { p_case_id: laAuth.id, p_approve: true });
    expect(r3.error?.message ?? '').toMatch(/cross-county/i);
  }
});

test('county: admin sees every county', async () => {
  const adm = await asUser(ADMIN);
  const { data: cases } = await adm.from('cases').select('county');
  const counties = new Set((cases ?? []).map(c => c.county));
  expect(counties.size).toBeGreaterThan(5);
  expect(counties.has('Los Angeles')).toBe(true);
  expect(counties.has('San Diego')).toBe(true);
});

test('county: new application routes to an in-county worker and appears in that queue', async () => {
  const applicant = await asUser(SD_APPLICANT);
  const { data, error } = await applicant.rpc('submit_application', {
    p: {
      county: 'San Diego', programs: ['CF'],
      persons: [{ name: 'Test Isolation', age: 34, employed: true }],
      monthlyIncome: 900, resources: 200, rent: 1100, utilities: 150, flags: {},
    },
  });
  expect(error).toBeNull();
  const row = Array.isArray(data) ? data[0] : data;
  const caseId = row.case_id as string;

  // service view: case is San Diego and its assignee is a San Diego worker
  const admin = svc();
  const { data: c } = await admin.from('cases').select('county, assigned_to, profiles!cases_assigned_to_fkey(county, role)').eq('id', caseId).single();
  expect(c!.county).toBe('San Diego');
  const assignee = c!.profiles as unknown as { county: string; role: string };
  expect(assignee.county).toBe('San Diego');

  // the SD worker sees the new intake task; the LA worker does not
  const sd = await asUser(SD_WORKER);
  const { data: sdTasks } = await sd.from('tasks').select('case_id').eq('case_id', caseId);
  expect((sdTasks ?? []).length).toBe(1);
  const la = await asUser(LA_WORKER);
  const { data: laTasks } = await la.from('tasks').select('case_id').eq('case_id', caseId);
  expect((laTasks ?? []).length).toBe(0);

  // cleanup the ad-hoc case so reseed stays pristine between runs
  await admin.from('cases').delete().eq('id', caseId);
});
