// ============================================================================
// CalSAWS Reimagined — seed core (used by `npm run db:seed` and Admin reset)
// Idempotent: safe to re-run. Creates demo auth users once; wipes + reseeds
// case data; upserts rule defaults. Never deletes auth users.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_PARAMS, paramsToRows, cloneParams } from './params';
import { runEDBC, type CaseSnapshot, type Program } from './engine';

export const DEMO_PASSWORD = 'CalSAWS-demo-2026!';
export const DEMO_USERS = [
  { email: 'applicant.maria@demo.calsaws.test', role: 'applicant', full_name: 'Maria Reyes', county: 'Los Angeles', title: 'Applicant', worker_id: null },
  { email: 'worker.dana@demo.calsaws.test', role: 'worker', full_name: 'Dana Whitfield', county: 'Los Angeles', title: 'Eligibility Worker II', worker_id: '19LS01220A' },
  { email: 'supervisor.angela@demo.calsaws.test', role: 'supervisor', full_name: 'Angela Ruiz', county: 'Los Angeles', title: 'Eligibility Supervisor', worker_id: '19LS01200S' },
  { email: 'admin.chris@demo.calsaws.test', role: 'admin', full_name: 'Chris Yamamoto', county: 'Statewide', title: 'System Administrator', worker_id: null },
] as const;

const EXTRA_WORKERS = [
  { full_name: 'Miguel Santos', county: 'Los Angeles', title: 'Eligibility Worker II', worker_id: '19LS01230B' },
  { full_name: 'Keisha Brown', county: 'San Diego', title: 'Eligibility Worker I', worker_id: '37LS02110C' },
  { full_name: 'Paul Tran', county: 'Fresno', title: 'Eligibility Worker III', worker_id: '10LS01050D' },
];

// mulberry32 — deterministic PRNG (same seed as v1 -> same caseload shape)
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: readonly T[]) => arr[Math.floor(r() * arr.length)];
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

const COUNTIES = ['Los Angeles', 'San Diego', 'Alameda', 'Fresno', 'Sacramento', 'Riverside', 'Kern', 'Orange', 'Santa Clara', 'Humboldt'];
const FIRST = ['Aisha', 'Carlos', 'Mei', 'Devon', 'Fatima', 'Jose', 'Viktor', 'Rosa', 'Samuel', 'Priya', 'Marcus', 'Elena', 'Tou', 'Gabriela', 'Andre', 'Yesenia', 'Daniel', 'Amara', 'Hector', 'Kim', 'Luis', 'Nadia', 'Tyrone', 'Blanca', 'Sergei'];
const LAST = ['Hassan', 'Mendoza', 'Chen', 'Williams', 'Alvarez', 'Johnson', 'Vang', 'Petrov', 'Garcia', 'Patel', 'Washington', 'Torres', 'Xiong', 'Morales', 'Jackson', 'Ramirez', 'Kim', 'Osman', 'Flores', 'Park', 'Herrera', 'Ali', 'Freeman', 'Castillo', 'Ivanov'];
const KIDS = ['Sofia', 'Diego', 'An', 'Bao', 'Leila', 'Mateo', 'Grace', 'Omar', 'Isabella', 'Ethan', 'Camila', 'Noah', 'Zara', 'Kai', 'Lucia'];
const STREETS = ['Mission St', 'Olive Ave', 'Cesar Chavez Blvd', 'Sierra Vista Dr', 'Willow Ln', 'Harbor Way', 'El Camino Real', 'Magnolia St', 'Riverside Dr', 'Union Ave'];
const ssn = (r: () => number) => `9${Math.floor(r() * 90 + 10)}-${Math.floor(r() * 90 + 10)}-${String(Math.floor(r() * 10000)).padStart(4, '0')}`;

interface SeedCase {
  case_number: string; county: string; programs: Program[]; status: string;
  application_date: string; source: string; intake_mode: string; expedited?: boolean;
  golden_tag?: string; expected_note?: string; assignKey: number; applicantLink?: boolean;
  snapshot: CaseSnapshot & { address?: string; phone?: string };
}

function goldenCases(): SeedCase[] {
  return [
    {
      case_number: 'C-100001', county: 'Los Angeles', programs: ['CF', 'CW', 'MC'], status: 'pending',
      application_date: daysAgo(6), source: 'BenefitsCal e-Application', intake_mode: 'Regular Intake', assignKey: 0,
      golden_tag: 'GH1', expected_note: 'Expected: CF $686 · CW $675 · MC children eligible', applicantLink: true,
      snapshot: {
        persons: [
          { id: 'p1', name: 'Maria Reyes', age: 29, role: 'primary', citizen: true, employed: true },
          { id: 'p2', name: 'Sofia Reyes', age: 7, role: 'member', citizen: true },
          { id: 'p3', name: 'Diego Reyes', age: 4, role: 'member', citizen: true },
        ],
        income: [{ personId: 'p1', kind: 'earned', subtype: 'Wages — Part-time retail', amount: 1600 }],
        resources: [{ kind: 'liquid', label: 'Checking account', value: 250 }],
        expenses: [{ kind: 'rent', amount: 1400 }, { kind: 'utilities', amount: 180 }],
        flags: {}, dataMatches: [
          { source: 'IEVS (EDD wages)', field: 'earned income', reported: 1600, matched: 1600, resolved: true },
          { source: 'SSA SSN validation', field: 'SSN', reported: 1, matched: 1, resolved: true },
        ],
        address: '2214 Cesar Chavez Blvd, Los Angeles, CA 90033', phone: '(213) 555-0148',
      },
    },
    {
      case_number: 'C-100002', county: 'Los Angeles', programs: ['CF', 'GA', 'MC'], status: 'pending',
      application_date: daysAgo(1), source: 'BenefitsCal e-Application', intake_mode: 'Regular Intake', assignKey: 0,
      golden_tag: 'GH2', expedited: true, expected_note: 'Expected: EXPEDITED 3-day · CF $298 · GA $221 · MC adult',
      snapshot: {
        persons: [{ id: 'p1', name: 'James Carter', age: 42, role: 'primary', citizen: true }],
        income: [], resources: [{ kind: 'liquid', label: 'Checking account', value: 40 }], expenses: [],
        flags: { homeless: true },
        dataMatches: [{ source: 'SSA SSN validation', field: 'SSN', reported: 1, matched: 1, resolved: true }],
        address: 'General Delivery, Los Angeles, CA 90014', phone: '(213) 555-0921',
      },
    },
    {
      case_number: 'C-100003', county: 'Santa Clara', programs: ['CF', 'CW', 'MC'], status: 'pending',
      application_date: daysAgo(12), source: 'County office (SAWS 1)', intake_mode: 'Regular Intake', assignKey: 2,
      golden_tag: 'GH3', expected_note: 'Expected: CF denied (gross) · CW denied · MC children only',
      snapshot: {
        persons: [
          { id: 'p1', name: 'Linh Nguyen', age: 38, role: 'primary', citizen: true, employed: true },
          { id: 'p2', name: 'Minh Nguyen', age: 40, role: 'member', citizen: true, employed: true },
          { id: 'p3', name: 'An Nguyen', age: 10, role: 'member', citizen: true },
          { id: 'p4', name: 'Bao Nguyen', age: 12, role: 'member', citizen: true },
        ],
        income: [
          { personId: 'p1', kind: 'earned', subtype: 'Wages — Warehouse lead', amount: 3000 },
          { personId: 'p2', kind: 'earned', subtype: 'Wages — Medical assistant', amount: 2800 },
        ],
        resources: [{ kind: 'liquid', label: 'Savings', value: 4200 }],
        expenses: [{ kind: 'rent', amount: 2400 }, { kind: 'utilities', amount: 250 }],
        flags: {}, dataMatches: [{ source: 'IEVS (EDD wages)', field: 'earned income', reported: 5800, matched: 5800, resolved: true }],
        address: '118 Willow Ln, San Jose, CA 95112', phone: '(408) 555-0377',
      },
    },
    {
      case_number: 'C-100004', county: 'Alameda', programs: ['CAPI', 'MC'], status: 'pending',
      application_date: daysAgo(9), source: 'County office (SAWS 1)', intake_mode: 'Regular Intake', assignKey: 1,
      golden_tag: 'GH4', expected_note: 'Expected: CAPI $453 · MC aged eligible',
      snapshot: {
        persons: [{ id: 'p1', name: 'Robert Okafor', age: 68, role: 'primary', citizen: false, aged: true, ssiIneligibleImmigration: true, immigrationStatus: 'LPR < 5 years' }],
        income: [{ personId: 'p1', kind: 'unearned', subtype: 'Foreign pension', amount: 800 }],
        resources: [{ kind: 'liquid', label: 'Savings', value: 900 }],
        expenses: [{ kind: 'rent', amount: 700 }],
        flags: {}, dataMatches: [{ source: 'SAVE (immigration)', field: 'status', reported: 1, matched: 1, resolved: true }],
        address: '77 Harbor Way, Oakland, CA 94607', phone: '(510) 555-0284',
      },
    },
    {
      case_number: 'C-100005', county: 'Los Angeles', programs: ['CF', 'CW'], status: 'yellow_banner',
      application_date: daysAgo(4), source: 'BenefitsCal e-Application', intake_mode: 'Regular Intake', assignKey: 0,
      golden_tag: 'GH5', expected_note: 'Yellow Banner: IEVS wage match $2,400 ≠ reported $1,600 — resolve to run EDBC',
      snapshot: {
        persons: [
          { id: 'p1', name: 'Tanya Brooks', age: 33, role: 'primary', citizen: true, employed: true },
          { id: 'p2', name: 'Leila Brooks', age: 6, role: 'member', citizen: true },
        ],
        income: [{ personId: 'p1', kind: 'earned', subtype: 'Wages — Food service', amount: 1600 }],
        resources: [{ kind: 'liquid', label: 'Checking account', value: 120 }],
        expenses: [{ kind: 'rent', amount: 1250 }, { kind: 'utilities', amount: 140 }],
        flags: {}, dataMatches: [
          { source: 'IEVS (EDD wages)', field: 'earned income', reported: 1600, matched: 2400, resolved: false },
        ],
        address: '941 Olive Ave, Los Angeles, CA 90015', phone: '(323) 555-0466',
      },
    },
  ];
}

function generatedCases(): SeedCase[] {
  const r = rng(20260706);
  const out: SeedCase[] = [];
  const SHAPES: Program[][] = [
    ['CF'], ['CF'], ['CF'], ['CF', 'MC'], ['CF', 'MC'], ['CF', 'MC'],
    ['CF', 'CW', 'MC'], ['CF', 'CW', 'MC'], ['MC'], ['MC'], ['GA', 'CF'], ['CAPI', 'MC'], ['RCA', 'CF'],
  ];
  for (let i = 0; i < 45; i++) {
    const programs = pick(r, SHAPES);
    const county = pick(r, COUNTIES);
    const last = pick(r, LAST);
    const isFamily = programs.includes('CW');
    const isAgedCapi = programs.includes('CAPI');
    const isRefugee = programs.includes('RCA');
    const isGA = programs.includes('GA');

    const persons: CaseSnapshot['persons'] = [];
    const primaryAge = isAgedCapi ? 66 + Math.floor(r() * 15) : 22 + Math.floor(r() * 40);
    persons.push({
      id: 'p1', name: `${pick(r, FIRST)} ${last}`, age: primaryAge, role: 'primary',
      citizen: !isAgedCapi && !isRefugee, employed: r() > 0.45,
      aged: primaryAge >= 65, disabled: r() > 0.88, refugee: isRefugee,
      arrivalMonthsAgo: isRefugee ? Math.floor(r() * 10) : undefined,
      ssiIneligibleImmigration: isAgedCapi,
    });
    if (!isGA && !isAgedCapi) {
      const kidCount = isFamily ? 1 + Math.floor(r() * 3) : Math.floor(r() * 3);
      for (let k = 0; k < kidCount; k++) {
        persons.push({ id: `p${persons.length + 1}`, name: `${pick(r, KIDS)} ${last}`, age: 1 + Math.floor(r() * 16), role: 'member', citizen: true });
      }
      if (r() > 0.6) persons.push({ id: `p${persons.length + 1}`, name: `${pick(r, FIRST)} ${last}`, age: 24 + Math.floor(r() * 30), role: 'member', citizen: true, employed: r() > 0.5 });
    }

    const employed = persons.filter(p => p.employed);
    const income: CaseSnapshot['income'] = [];
    employed.forEach(p => income.push({ personId: p.id, kind: 'earned', subtype: 'Wages', amount: Math.round((600 + r() * 3400) / 25) * 25 }));
    if (r() > 0.65) income.push({ personId: 'p1', kind: 'unearned', subtype: pick(r, ['Unemployment (UI)', 'Child support', 'Social Security', 'Disability (SDI)']), amount: Math.round((200 + r() * 900) / 25) * 25 });
    if (isAgedCapi) income.push({ personId: 'p1', kind: 'unearned', subtype: 'Foreign pension', amount: Math.round((100 + r() * 800) / 25) * 25 });

    const rent = Math.round((700 + r() * 1900) / 50) * 50;
    const roll = r();
    const status = roll < 0.55 ? 'approved' : roll < 0.7 ? 'denied' : roll < 0.85 ? 'pending' : roll < 0.95 ? 'renewal_due' : 'pending';
    if (status === 'denied') {
      income.forEach(x => { x.amount = Math.round(x.amount * 3.2); });
      if (!income.length) income.push({ personId: 'p1', kind: 'earned', subtype: 'Wages', amount: 6800 });
    }
    const appliedDays = status === 'pending' ? Math.floor(r() * 25) : 30 + Math.floor(r() * 120);
    const homeless = r() > 0.93;
    const earnedTotal = income.filter(x => x.kind === 'earned').reduce((s, x) => s + x.amount, 0);

    out.push({
      case_number: `C-${100100 + i}`, county, programs, status,
      application_date: daysAgo(appliedDays),
      source: r() > 0.4 ? 'BenefitsCal e-Application' : 'County office (SAWS 1)',
      intake_mode: r() > 0.85 ? 'Add-a-Program' : 'Regular Intake',
      expedited: status === 'pending' && homeless,
      assignKey: Math.floor(r() * 4),
      snapshot: {
        persons, income,
        resources: [{ kind: 'liquid', label: 'Bank account', value: Math.round(r() * 2800) }],
        expenses: [{ kind: 'rent', amount: rent }, { kind: 'utilities', amount: 100 + Math.round(r() * 180) }],
        flags: { homeless },
        dataMatches: [{ source: 'IEVS (EDD wages)', field: 'earned income', reported: earnedTotal, matched: earnedTotal, resolved: true }],
        address: `${100 + Math.floor(r() * 8900)} ${pick(r, STREETS)}, ${county}, CA 9${Math.floor(r() * 900) + 100}${Math.floor(r() * 10)}`,
        phone: `(${pick(r, ['213', '310', '408', '510', '559', '619', '626', '707', '916', '951'])}) 555-0${100 + Math.floor(r() * 900)}`,
      },
    });
  }
  return out;
}

export interface SeedLog { push(msg: string): void }

export async function seedAll(admin: SupabaseClient, log: SeedLog = { push: () => {} }) {
  // ---- 1. demo auth users (create once; never delete) ----
  const profileIds: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: u.email, password: DEMO_PASSWORD, email_confirm: true,
      app_metadata: { calsaws_role: u.role, calsaws_county: u.county, calsaws_worker_id: u.worker_id, calsaws_title: u.title },
      user_metadata: { full_name: u.full_name },
    });
    let authId = created?.user?.id;
    if (error) {
      // already exists — find it
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      authId = list?.users.find(x => x.email === u.email)?.id;
      if (!authId) throw new Error(`demo user ${u.email}: ${error.message}`);
    }
    // trigger may have created the profile; upsert to be safe and capture id
    const { data: prof, error: pErr } = await admin.from('profiles')
      .upsert({ auth_user_id: authId, role: u.role, full_name: u.full_name, county: u.county, worker_id: u.worker_id, title: u.title }, { onConflict: 'auth_user_id' })
      .select('id').single();
    if (pErr) throw new Error(`profile ${u.email}: ${pErr.message}`);
    profileIds[u.role === 'worker' ? 'worker0' : u.role] = prof.id;
    log.push(`user ready: ${u.email}`);
  }
  // extra login-less worker profiles for workload realism
  const workerIds: string[] = [profileIds['worker0']];
  for (const w of EXTRA_WORKERS) {
    const { data: existing } = await admin.from('profiles').select('id').eq('worker_id', w.worker_id).maybeSingle();
    if (existing) { workerIds.push(existing.id); continue; }
    const { data: prof, error } = await admin.from('profiles')
      .insert({ role: 'worker', full_name: w.full_name, county: w.county, worker_id: w.worker_id, title: w.title })
      .select('id').single();
    if (error) throw new Error(`extra worker ${w.full_name}: ${error.message}`);
    workerIds.push(prof.id);
  }

  // ---- 2. wipe case data (auth users + profiles survive) ----
  await admin.from('cases').delete().neq('case_number', '__none__'); // cascades all children
  log.push('case data wiped');

  // ---- 3. rule defaults ----
  const rows = paramsToRows(DEFAULT_PARAMS);
  const { error: rpErr } = await admin.from('rule_params').upsert(rows, { onConflict: 'path' });
  if (rpErr) throw new Error(`rule_params: ${rpErr.message}`);
  log.push(`rule_params seeded (${rows.length})`);

  // ---- 4. cases ----
  const P = cloneParams();
  const all = [...goldenCases(), ...generatedCases()];
  const r = rng(99);
  let inserted = 0;
  for (const sc of all) {
    const assigned = workerIds[sc.assignKey % workerIds.length];
    const { data: c, error: cErr } = await admin.from('cases').insert({
      case_number: sc.case_number, county: sc.county, status: sc.status, programs: sc.programs,
      application_date: sc.application_date, source: sc.source, intake_mode: sc.intake_mode,
      expedited: !!sc.expedited, assigned_to: assigned,
      applicant_profile_id: sc.applicantLink ? profileIds['applicant'] : null,
      golden_tag: sc.golden_tag ?? null, expected_note: sc.expected_note ?? null,
      flags: sc.snapshot.flags ?? {}, address: sc.snapshot.address ?? null, phone: sc.snapshot.phone ?? null,
    }).select('id').single();
    if (cErr) throw new Error(`case ${sc.case_number}: ${cErr.message}`);
    const caseId = c.id as string;

    await admin.from('persons').insert(sc.snapshot.persons.map(p => ({
      case_id: caseId, person_key: p.id, name: p.name, age: p.age, role: p.role,
      citizen: p.citizen ?? true, immigration_status: p.immigrationStatus ?? null,
      aged: !!p.aged, disabled: !!p.disabled, blind: !!p.blind, pregnant: !!p.pregnant,
      refugee: !!p.refugee, arrival_months_ago: p.arrivalMonthsAgo ?? null,
      ssi_ineligible_immigration: !!p.ssiIneligibleImmigration, employed: !!p.employed,
      ssn: ssn(r), dob: null,
    })));
    if (sc.snapshot.income.length) await admin.from('income_records').insert(sc.snapshot.income.map(i => ({
      case_id: caseId, person_key: i.personId, kind: i.kind, subtype: i.subtype, amount: i.amount,
    })));
    await admin.from('resource_records').insert(sc.snapshot.resources.map(x => ({ case_id: caseId, kind: x.kind, label: x.label ?? null, value: x.value })));
    await admin.from('expense_records').insert(sc.snapshot.expenses.filter(e => e.amount > 0).map(e => ({ case_id: caseId, kind: e.kind, amount: e.amount })));
    await admin.from('data_matches').insert(sc.snapshot.dataMatches.map(m => ({ case_id: caseId, source: m.source, field: m.field, reported: m.reported, matched: m.matched, resolved: m.resolved })));
    await admin.from('journal_entries').insert({
      case_id: caseId, kind: 'Application', date: sc.application_date,
      text: `Application registered via ${sc.source} (${sc.intake_mode}) for ${sc.programs.join(', ')}.`,
    });

    // open tasks for in-flight statuses
    if (sc.status === 'pending' || sc.status === 'yellow_banner') {
      await admin.from('tasks').insert({
        case_id: caseId,
        type: sc.expedited ? 'Expedited Intake' : sc.status === 'yellow_banner' ? 'Yellow Banner Review' : 'Process Application',
        priority: sc.expedited ? 'Critical' : sc.status === 'yellow_banner' ? 'High' : 'Normal',
        due_date: addDays(sc.application_date, sc.expedited ? 3 : 30),
        assigned_to: assigned,
      });
    }
    if (sc.status === 'renewal_due') {
      await admin.from('tasks').insert({ case_id: caseId, type: 'Renewal (RE) Due', priority: 'Normal', due_date: addDays(new Date().toISOString().slice(0, 10), 10), assigned_to: assigned });
    }

    // engine-computed history for terminal states (reports reconcile with the engine)
    if (['approved', 'denied', 'renewal_due'].includes(sc.status)) {
      const out = runEDBC(P, sc.snapshot, sc.programs);
      if (!out.blocked) {
        const anyElig = out.results.some(x => x.status === 'Eligible');
        const trueStatus = sc.status === 'renewal_due' ? (anyElig ? 'renewal_due' : 'denied') : (anyElig ? 'approved' : 'denied');
        if (trueStatus !== sc.status) await admin.from('cases').update({ status: trueStatus }).eq('id', caseId);
        const runDate = addDays(sc.application_date, 3);
        const { data: run } = await admin.from('edbc_runs').insert({
          case_id: caseId, benefit_month: runDate.slice(0, 7), run_by: assigned,
          accepted: true, accepted_by: assigned, accepted_at: runDate + 'T12:00:00Z',
        }).select('id').single();
        await admin.from('edbc_results').insert(out.results.map(res => ({
          run_id: run!.id, program: res.program, status: res.status, amount: res.amount,
          aid_code: res.aidCode ?? null, expedited: !!res.expedited,
          reasons: res.reasons, trace: res.trace, members: res.members ?? null,
        })));
        for (const res of out.results) {
          await admin.from('notices').insert({
            case_id: caseId, program: res.program,
            type: res.status === 'Eligible' ? 'Approval NOA' : 'Denial NOA',
            amount: res.amount, reasons: res.reasons.map(x => x.text), date: runDate,
          });
          if (res.status === 'Eligible' && res.amount > 0) {
            for (let m = 0; m < 3; m++) {
              const d = new Date(); d.setMonth(d.getMonth() - m); d.setDate(3);
              const iso = d.toISOString().slice(0, 10);
              if (iso >= runDate) await admin.from('issuances').insert({ case_id: caseId, program: res.program, amount: res.amount, date: iso });
            }
          }
        }
        await admin.from('journal_entries').insert({
          case_id: caseId, kind: 'EDBC', date: runDate,
          text: `EDBC run — ${out.results.map(x => `${x.program}: ${x.status}${x.amount ? ` $${x.amount}` : ''}`).join('; ')}. Accepted and saved.`,
        });
      }
    }
    inserted++;
  }
  log.push(`cases seeded: ${inserted}`);
  return { cases: inserted };
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
