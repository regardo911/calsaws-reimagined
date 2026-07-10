// ============================================================================
// CalSAWS Reimagined — seed core (used by `npm run db:seed` and Admin reset)
// County-scoped roster: 12 counties x {worker, supervisor, applicant} + 1 admin
// = 37 login accounts. Every case is assigned IN-COUNTY so county-scoped RLS
// (migration 0003) shows a coherent, isolated caseload per county.
// Idempotent: creates demo auth users once; wipes + reseeds case data; upserts
// rule defaults. Never deletes auth users.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_PARAMS, paramsToRows, cloneParams } from './params';
import { runEDBC, type CaseSnapshot, type Program } from './engine';

export const DEMO_PASSWORD = 'CalSAWS-demo-2026!';

// ---------- 12 target counties (real CA county codes; slug = email localpart) ----------
export interface County { name: string; code: string; slug: string }
export const COUNTIES: County[] = [
  { name: 'Los Angeles', code: '19', slug: 'la' }, // LA keeps named accounts (slug unused for emails)
  { name: 'San Diego', code: '37', slug: 'sandiego' },
  { name: 'Orange', code: '30', slug: 'orange' },
  { name: 'Riverside', code: '33', slug: 'riverside' },
  { name: 'San Bernardino', code: '36', slug: 'sanbernardino' },
  { name: 'Santa Clara', code: '43', slug: 'santaclara' },
  { name: 'Alameda', code: '01', slug: 'alameda' },
  { name: 'Sacramento', code: '34', slug: 'sacramento' },
  { name: 'Contra Costa', code: '07', slug: 'contracosta' },
  { name: 'Fresno', code: '10', slug: 'fresno' },
  { name: 'Kern', code: '15', slug: 'kern' },
  { name: 'San Francisco', code: '38', slug: 'sanfrancisco' },
];
// County name list for pickers (apply wizard, worker register) — single source of truth.
export const COUNTY_NAMES: string[] = COUNTIES.map(c => c.name);
const CODE = Object.fromEntries(COUNTIES.map(c => [c.name, c.code])) as Record<string, string>;

type Role = 'applicant' | 'worker' | 'supervisor' | 'admin';
interface Account { email: string; role: Role; full_name: string; county: string; title: string; worker_id: string | null }

// ---------- the 37 login accounts (LA named; every other county uniform slug pattern) ----------
// Names avoid all golden-household surnames (Reyes/Carter/Nguyen/Okafor/Brooks).
const LA_ACCOUNTS: Account[] = [
  { email: 'worker.dana@demo.calsaws.test', role: 'worker', full_name: 'Dana Whitfield', county: 'Los Angeles', title: 'Eligibility Worker II', worker_id: '19LS01220A' },
  { email: 'supervisor.angela@demo.calsaws.test', role: 'supervisor', full_name: 'Angela Ruiz', county: 'Los Angeles', title: 'Eligibility Supervisor', worker_id: '19LS01200S' },
  { email: 'applicant.maria@demo.calsaws.test', role: 'applicant', full_name: 'Maria Reyes', county: 'Los Angeles', title: 'Applicant', worker_id: null },
];
// [worker name, worker title, supervisor name, applicant name] per non-LA county
const COUNTY_PEOPLE: Record<string, [string, string, string, string]> = {
  'San Diego': ['Keisha Brown', 'Eligibility Worker I', 'Marcus Delgado', 'Sofia Herrera'],
  'Orange': ['Brian Pham', 'Eligibility Worker II', 'Linda Whitmore', 'Hector Salas'],
  'Riverside': ['Tanisha Coleman', 'Eligibility Worker II', 'Raymond Ortiz', 'Priya Nair'],
  'San Bernardino': ['Andre Watkins', 'Eligibility Worker I', 'Diana Castillo', 'Omar Haddad'],
  'Santa Clara': ['Wei Chen', 'Eligibility Worker III', 'Rebecca Goldman', 'Anh Ly'],
  'Alameda': ['Jamal Robinson', 'Eligibility Worker II', 'Grace Okonkwo', 'Carlos Mendez'],
  'Sacramento': ['Emily Larsen', 'Eligibility Worker II', 'David Schmidt', 'Rosa Alvarez'],
  'Contra Costa': ['Nadia Farouk', 'Eligibility Worker I', 'Thomas Reilly', 'Kevin Park'],
  'Fresno': ['Paul Tran', 'Eligibility Worker III', 'Gloria Vasquez', 'Blanca Torres'],
  'Kern': ['Cody Bautista', 'Eligibility Worker II', 'Sandra Mercer', 'Luis Cardenas'],
  'San Francisco': ['Helen Liu', 'Eligibility Worker II', 'Daniel Mensah', 'Yesenia Flores'],
};

function buildRoster(): Account[] {
  const out: Account[] = [...LA_ACCOUNTS];
  for (const c of COUNTIES) {
    if (c.name === 'Los Angeles') continue;
    const [wName, wTitle, sName, aName] = COUNTY_PEOPLE[c.name];
    out.push({ email: `worker.${c.slug}@demo.calsaws.test`, role: 'worker', full_name: wName, county: c.name, title: wTitle, worker_id: `${c.code}LS01100A` });
    out.push({ email: `supervisor.${c.slug}@demo.calsaws.test`, role: 'supervisor', full_name: sName, county: c.name, title: 'Eligibility Supervisor', worker_id: `${c.code}LS01000S` });
    out.push({ email: `applicant.${c.slug}@demo.calsaws.test`, role: 'applicant', full_name: aName, county: c.name, title: 'Applicant', worker_id: null });
  }
  out.push({ email: 'admin.chris@demo.calsaws.test', role: 'admin', full_name: 'Chris Yamamoto', county: 'Statewide', title: 'System Administrator', worker_id: null });
  return out;
}
export const ROSTER: Account[] = buildRoster(); // 37 accounts; also drives the docs "Accounts by County" table

// One login-less LA second worker so the /supervisor/team reassignment demo has an
// in-county target. Not one of the 37 login accounts.
const EXTRA_WORKERS = [
  { full_name: 'Miguel Santos', county: 'Los Angeles', title: 'Eligibility Worker II', worker_id: '19LS01230B' },
];

// mulberry32 — deterministic PRNG (stable caseload shape per seed)
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

const FIRST = ['Aisha', 'Carlos', 'Mei', 'Devon', 'Fatima', 'Jose', 'Viktor', 'Rosa', 'Samuel', 'Priya', 'Marcus', 'Elena', 'Tou', 'Gabriela', 'Andre', 'Yesenia', 'Daniel', 'Amara', 'Hector', 'Kim', 'Luis', 'Nadia', 'Tyrone', 'Blanca', 'Sergei'];
const LAST = ['Hassan', 'Mendoza', 'Chen', 'Williams', 'Alvarez', 'Johnson', 'Vang', 'Petrov', 'Garcia', 'Patel', 'Washington', 'Torres', 'Xiong', 'Morales', 'Jackson', 'Ramirez', 'Kim', 'Osman', 'Flores', 'Park', 'Herrera', 'Ali', 'Freeman', 'Castillo', 'Ivanov'];
const KIDS = ['Sofia', 'Diego', 'An', 'Bao', 'Leila', 'Mateo', 'Grace', 'Omar', 'Isabella', 'Ethan', 'Camila', 'Noah', 'Zara', 'Kai', 'Lucia'];
const STREETS = ['Mission St', 'Olive Ave', 'Cesar Chavez Blvd', 'Sierra Vista Dr', 'Willow Ln', 'Harbor Way', 'El Camino Real', 'Magnolia St', 'Riverside Dr', 'Union Ave'];
const ssn = (r: () => number) => `9${Math.floor(r() * 90 + 10)}-${Math.floor(r() * 90 + 10)}-${String(Math.floor(r() * 10000)).padStart(4, '0')}`;
const AREA = ['213', '310', '408', '510', '559', '619', '626', '707', '916', '951'];

interface SeedCase {
  case_number: string; county: string; programs: Program[]; status: string;
  application_date: string; source: string; intake_mode: string; expedited?: boolean;
  golden_tag?: string; expected_note?: string;
  slot?: 'primary' | 'secondary';   // LA only: route to Dana (primary) vs Miguel (secondary)
  linkApplicant?: boolean;          // link applicant_profile_id to this county's applicant
  seedAuth?: boolean;               // seed an accepted EDBC run + set pending_authorization (no open task)
  snapshot: CaseSnapshot & { address?: string; phone?: string };
}

// ---------- Golden households (all in Los Angeles; dollar outcomes byte-identical) ----------
function goldenCases(): SeedCase[] {
  return [
    {
      case_number: 'C-100001', county: 'Los Angeles', programs: ['CF', 'CW', 'MC'], status: 'pending',
      application_date: daysAgo(6), source: 'BenefitsCal e-Application', intake_mode: 'Regular Intake', slot: 'primary',
      golden_tag: 'GH1', expected_note: 'Expected: CF $686 · CW $675 · MC children eligible', linkApplicant: true,
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
      application_date: daysAgo(1), source: 'BenefitsCal e-Application', intake_mode: 'Regular Intake', slot: 'primary',
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
      // GH3 relocated Santa Clara -> Los Angeles (county/address/phone only; denial is county-independent)
      case_number: 'C-100003', county: 'Los Angeles', programs: ['CF', 'CW', 'MC'], status: 'pending',
      application_date: daysAgo(12), source: 'County office (SAWS 1)', intake_mode: 'Regular Intake', slot: 'secondary',
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
        address: '118 Willow Ln, Los Angeles, CA 90042', phone: '(323) 555-0377',
      },
    },
    {
      // GH4 relocated Alameda -> Los Angeles (county/address/phone only; CAPI $453 is county-independent)
      case_number: 'C-100004', county: 'Los Angeles', programs: ['CAPI', 'MC'], status: 'pending',
      application_date: daysAgo(9), source: 'County office (SAWS 1)', intake_mode: 'Regular Intake', slot: 'secondary',
      golden_tag: 'GH4', expected_note: 'Expected: CAPI $453 · MC aged eligible',
      snapshot: {
        persons: [{ id: 'p1', name: 'Robert Okafor', age: 68, role: 'primary', citizen: false, aged: true, ssiIneligibleImmigration: true, immigrationStatus: 'LPR < 5 years' }],
        income: [{ personId: 'p1', kind: 'unearned', subtype: 'Foreign pension', amount: 800 }],
        resources: [{ kind: 'liquid', label: 'Savings', value: 900 }],
        expenses: [{ kind: 'rent', amount: 700 }],
        flags: {}, dataMatches: [{ source: 'SAVE (immigration)', field: 'status', reported: 1, matched: 1, resolved: true }],
        address: '77 Harbor Way, Los Angeles, CA 90731', phone: '(310) 555-0284',
      },
    },
    {
      case_number: 'C-100005', county: 'Los Angeles', programs: ['CF', 'CW'], status: 'yellow_banner',
      application_date: daysAgo(4), source: 'BenefitsCal e-Application', intake_mode: 'Regular Intake', slot: 'primary',
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

// ---------- Household shape factories (used by LA-generated + per-county templates) ----------
type Shape = 'cf-approved' | 'family-pending' | 'expedited' | 'family-auth' | 'yellow' | 'denied' | 'capi-approved' | 'mc-only';

function addr(r: () => number, county: string): { address: string; phone: string } {
  return {
    address: `${100 + Math.floor(r() * 8900)} ${pick(r, STREETS)}, ${county}, CA 9${Math.floor(r() * 900) + 100}${Math.floor(r() * 10)}`,
    phone: `(${pick(r, AREA)}) 555-0${100 + Math.floor(r() * 900)}`,
  };
}

function buildSnapshot(shape: Shape, r: () => number, county: string): SeedCase['snapshot'] {
  const last = pick(r, LAST);
  const A = addr(r, county);
  const money = (lo: number, hi: number) => Math.round((lo + r() * (hi - lo)) / 25) * 25;
  switch (shape) {
    case 'cf-approved': {
      return {
        persons: [{ id: 'p1', name: `${pick(r, FIRST)} ${last}`, age: 24 + Math.floor(r() * 30), role: 'primary', citizen: true, employed: true }],
        income: [{ personId: 'p1', kind: 'earned', subtype: 'Wages', amount: money(800, 1050) }],
        resources: [{ kind: 'liquid', label: 'Bank account', value: money(50, 600) }],
        expenses: [{ kind: 'rent', amount: money(1000, 1300) }, { kind: 'utilities', amount: 150 }],
        flags: {}, dataMatches: [{ source: 'IEVS (EDD wages)', field: 'earned income', reported: 0, matched: 0, resolved: true }],
        ...A,
      };
    }
    case 'family-pending':
    case 'family-auth': {
      const earned = money(1500, 1700);
      return {
        persons: [
          { id: 'p1', name: `${pick(r, FIRST)} ${last}`, age: 26 + Math.floor(r() * 14), role: 'primary', citizen: true, employed: true },
          { id: 'p2', name: `${pick(r, KIDS)} ${last}`, age: 3 + Math.floor(r() * 8), role: 'member', citizen: true },
          { id: 'p3', name: `${pick(r, KIDS)} ${last}`, age: 1 + Math.floor(r() * 6), role: 'member', citizen: true },
        ],
        income: [{ personId: 'p1', kind: 'earned', subtype: 'Wages — Part-time retail', amount: earned }],
        resources: [{ kind: 'liquid', label: 'Checking account', value: money(50, 400) }],
        expenses: [{ kind: 'rent', amount: money(1300, 1600) }, { kind: 'utilities', amount: 180 }],
        flags: {}, dataMatches: [{ source: 'IEVS (EDD wages)', field: 'earned income', reported: earned, matched: earned, resolved: true }],
        ...A,
      };
    }
    case 'expedited': {
      return {
        persons: [{ id: 'p1', name: `${pick(r, FIRST)} ${last}`, age: 30 + Math.floor(r() * 25), role: 'primary', citizen: true }],
        income: [], resources: [{ kind: 'liquid', label: 'Cash on hand', value: money(0, 80) }], expenses: [],
        flags: { homeless: true },
        dataMatches: [{ source: 'SSA SSN validation', field: 'SSN', reported: 1, matched: 1, resolved: true }],
        ...A,
      };
    }
    case 'yellow': {
      const reported = money(1400, 1700);
      return {
        persons: [
          { id: 'p1', name: `${pick(r, FIRST)} ${last}`, age: 28 + Math.floor(r() * 14), role: 'primary', citizen: true, employed: true },
          { id: 'p2', name: `${pick(r, KIDS)} ${last}`, age: 4 + Math.floor(r() * 8), role: 'member', citizen: true },
        ],
        income: [{ personId: 'p1', kind: 'earned', subtype: 'Wages — Food service', amount: reported }],
        resources: [{ kind: 'liquid', label: 'Checking account', value: money(50, 300) }],
        expenses: [{ kind: 'rent', amount: money(1100, 1400) }, { kind: 'utilities', amount: 140 }],
        flags: {}, dataMatches: [{ source: 'IEVS (EDD wages)', field: 'earned income', reported, matched: reported + 800, resolved: false }],
        ...A,
      };
    }
    case 'denied': {
      const earned = money(5600, 6400);
      return {
        persons: [
          { id: 'p1', name: `${pick(r, FIRST)} ${last}`, age: 30 + Math.floor(r() * 15), role: 'primary', citizen: true, employed: true },
          { id: 'p2', name: `${pick(r, FIRST)} ${last}`, age: 30 + Math.floor(r() * 15), role: 'member', citizen: true, employed: true },
          { id: 'p3', name: `${pick(r, KIDS)} ${last}`, age: 8 + Math.floor(r() * 8), role: 'member', citizen: true },
          { id: 'p4', name: `${pick(r, KIDS)} ${last}`, age: 6 + Math.floor(r() * 8), role: 'member', citizen: true },
        ],
        income: [{ personId: 'p1', kind: 'earned', subtype: 'Wages — Warehouse', amount: Math.round(earned * 0.55 / 25) * 25 }, { personId: 'p2', kind: 'earned', subtype: 'Wages — Clinic', amount: Math.round(earned * 0.45 / 25) * 25 }],
        resources: [{ kind: 'liquid', label: 'Savings', value: money(2000, 5000) }],
        expenses: [{ kind: 'rent', amount: money(2000, 2600) }, { kind: 'utilities', amount: 250 }],
        flags: {}, dataMatches: [{ source: 'IEVS (EDD wages)', field: 'earned income', reported: earned, matched: earned, resolved: true }],
        ...A,
      };
    }
    case 'capi-approved': {
      return {
        persons: [{ id: 'p1', name: `${pick(r, FIRST)} ${last}`, age: 66 + Math.floor(r() * 15), role: 'primary', citizen: false, aged: true, ssiIneligibleImmigration: true, immigrationStatus: 'LPR < 5 years' }],
        income: [{ personId: 'p1', kind: 'unearned', subtype: 'Foreign pension', amount: money(100, 800) }],
        resources: [{ kind: 'liquid', label: 'Savings', value: money(100, 1500) }],
        expenses: [{ kind: 'rent', amount: money(600, 900) }],
        flags: {}, dataMatches: [{ source: 'SAVE (immigration)', field: 'status', reported: 1, matched: 1, resolved: true }],
        ...A,
      };
    }
    case 'mc-only': {
      const earned = money(2600, 3400);
      return {
        persons: [
          { id: 'p1', name: `${pick(r, FIRST)} ${last}`, age: 30 + Math.floor(r() * 12), role: 'primary', citizen: true, employed: true },
          { id: 'p2', name: `${pick(r, KIDS)} ${last}`, age: 4 + Math.floor(r() * 10), role: 'member', citizen: true },
        ],
        income: [{ personId: 'p1', kind: 'earned', subtype: 'Wages', amount: earned }],
        resources: [{ kind: 'liquid', label: 'Bank account', value: money(200, 1200) }],
        expenses: [{ kind: 'rent', amount: money(1200, 1600) }, { kind: 'utilities', amount: 160 }],
        flags: {}, dataMatches: [{ source: 'IEVS (EDD wages)', field: 'earned income', reported: earned, matched: earned, resolved: true }],
        ...A,
      };
    }
  }
}

// LA gets 10 generated cases (rich pre-demo caseload). C-119001..C-119010.
function laGeneratedCases(): SeedCase[] {
  const r = rng(20260706 + 19);
  const plan: { shape: Shape; status: string; programs: Program[]; expedited?: boolean; seedAuth?: boolean }[] = [
    { shape: 'cf-approved', status: 'approved', programs: ['CF'] },
    { shape: 'family-pending', status: 'approved', programs: ['CF', 'CW', 'MC'] },
    { shape: 'mc-only', status: 'approved', programs: ['CF', 'MC'] },
    { shape: 'family-pending', status: 'pending', programs: ['CF', 'CW', 'MC'] },
    { shape: 'cf-approved', status: 'pending', programs: ['CF'] },
    { shape: 'expedited', status: 'pending', programs: ['CF'], expedited: true },
    { shape: 'yellow', status: 'yellow_banner', programs: ['CF', 'CW'] },
    { shape: 'family-auth', status: 'pending_authorization', programs: ['CF', 'CW', 'MC'], seedAuth: true },
    { shape: 'denied', status: 'denied', programs: ['CF', 'MC'] },
    { shape: 'denied', status: 'denied', programs: ['CF'] },
  ];
  return plan.map((p, i) => ({
    case_number: `C-119${String(i + 1).padStart(3, '0')}`, county: 'Los Angeles',
    programs: p.programs, status: p.status,
    application_date: daysAgo(2 + Math.floor(r() * 40)),
    source: r() > 0.4 ? 'BenefitsCal e-Application' : 'County office (SAWS 1)',
    intake_mode: 'Regular Intake', expedited: p.expedited, seedAuth: p.seedAuth,
    slot: i % 2 === 0 ? 'primary' : 'secondary',
    snapshot: buildSnapshot(p.shape, r, 'Los Angeles'),
  }));
}

// Every non-LA county: a 6-case representative template so its worker queue,
// supervisor authorizations, and applicant portal are all populated + isolated.
function countyTemplateCases(county: string): SeedCase[] {
  const code = CODE[county];
  const r = rng(20260706 + Number(code));
  const n = (seq: number) => `C-1${code}${String(seq).padStart(3, '0')}`;
  const spec: { shape: Shape; status: string; programs: Program[]; expedited?: boolean; seedAuth?: boolean; link?: boolean }[] = [
    { shape: 'cf-approved', status: 'approved', programs: ['CF'] },
    { shape: 'family-pending', status: 'pending', programs: ['CF', 'CW', 'MC'], link: true },
    { shape: 'expedited', status: 'pending', programs: ['CF'], expedited: true },
    { shape: 'family-auth', status: 'pending_authorization', programs: ['CF', 'CW', 'MC'], seedAuth: true },
    { shape: 'yellow', status: 'yellow_banner', programs: ['CF', 'CW'] },
    { shape: 'denied', status: 'denied', programs: ['CF', 'MC'] },
  ];
  return spec.map((s, i) => ({
    case_number: n(i + 1), county, programs: s.programs, status: s.status,
    application_date: daysAgo(3 + Math.floor(r() * 30)),
    source: i % 2 === 0 ? 'BenefitsCal e-Application' : 'County office (SAWS 1)',
    intake_mode: 'Regular Intake', expedited: s.expedited, seedAuth: s.seedAuth, linkApplicant: s.link,
    snapshot: buildSnapshot(s.shape, r, county),
  }));
}

export interface SeedLog { push(msg: string): void }

interface CountyProfiles { worker: string; supervisor: string; applicant: string; workers: string[] }

export async function seedAll(admin: SupabaseClient, log: SeedLog = { push: () => {} }) {
  // ---- 1. demo auth users (create once; never delete) + county-keyed profile map ----
  const byCounty: Record<string, CountyProfiles> = {};
  let adminId = '';
  const ensureCounty = (c: string) => (byCounty[c] ??= { worker: '', supervisor: '', applicant: '', workers: [] });

  for (const u of ROSTER) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: u.email, password: DEMO_PASSWORD, email_confirm: true,
      app_metadata: { calsaws_role: u.role, calsaws_county: u.county, calsaws_worker_id: u.worker_id, calsaws_title: u.title },
      user_metadata: { full_name: u.full_name },
    });
    let authId = created?.user?.id;
    if (error) {
      // already exists — find it (page size well above the 37-account roster)
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
      authId = list?.users.find(x => x.email === u.email)?.id;
      if (!authId) throw new Error(`demo user ${u.email}: ${error.message}`);
    }
    const { data: prof, error: pErr } = await admin.from('profiles')
      .upsert({ auth_user_id: authId, role: u.role, full_name: u.full_name, county: u.county, worker_id: u.worker_id, title: u.title }, { onConflict: 'auth_user_id' })
      .select('id').single();
    if (pErr) throw new Error(`profile ${u.email}: ${pErr.message}`);
    if (u.role === 'admin') { adminId = prof.id; }
    else {
      const cp = ensureCounty(u.county);
      if (u.role === 'worker') { cp.worker = prof.id; cp.workers.push(prof.id); }
      else if (u.role === 'supervisor') cp.supervisor = prof.id;
      else if (u.role === 'applicant') cp.applicant = prof.id;
    }
    log.push(`user ready: ${u.email}`);
  }

  // login-less LA second worker (reassignment demo target)
  for (const w of EXTRA_WORKERS) {
    const { data: existing } = await admin.from('profiles').select('id').eq('worker_id', w.worker_id).maybeSingle();
    let id = existing?.id as string | undefined;
    if (!id) {
      const { data: prof, error } = await admin.from('profiles')
        .insert({ role: 'worker', full_name: w.full_name, county: w.county, worker_id: w.worker_id, title: w.title })
        .select('id').single();
      if (error) throw new Error(`extra worker ${w.full_name}: ${error.message}`);
      id = prof.id as string;
    }
    ensureCounty(w.county).workers.push(id);
  }
  void adminId; // (admin sees all via RLS role branch; no case assignment)

  // ---- 2. wipe case data (auth users + profiles survive) ----
  await admin.from('cases').delete().neq('case_number', '__none__'); // cascades all children
  log.push('case data wiped');

  // ---- 3. rule defaults ----
  const rows = paramsToRows(DEFAULT_PARAMS);
  const { error: rpErr } = await admin.from('rule_params').upsert(rows, { onConflict: 'path' });
  if (rpErr) throw new Error(`rule_params: ${rpErr.message}`);
  log.push(`rule_params seeded (${rows.length})`);

  // ---- 4. assemble caseload: LA (5 golden + 10 generated) + 11 counties x 6 template ----
  const all: SeedCase[] = [...goldenCases(), ...laGeneratedCases()];
  for (const c of COUNTIES) if (c.name !== 'Los Angeles') all.push(...countyTemplateCases(c.name));

  // invariant: every county in the caseload must have a full in-county roster
  for (const sc of all) {
    const cp = byCounty[sc.county];
    if (!cp || !cp.worker || !cp.supervisor) throw new Error(`seed invariant: county "${sc.county}" lacks a worker+supervisor`);
  }

  const P = cloneParams();
  const laRR = { i: 0 };
  const r = rng(99);
  let inserted = 0;
  for (const sc of all) {
    const cp = byCounty[sc.county];
    // in-county assignment: LA routes by slot (Dana=primary/Miguel=secondary), else round-robin; other counties -> the county worker
    let assigned = cp.worker;
    if (sc.county === 'Los Angeles') {
      if (sc.slot === 'secondary' && cp.workers[1]) assigned = cp.workers[1];
      else if (sc.slot === 'primary') assigned = cp.workers[0];
      else assigned = cp.workers[laRR.i++ % cp.workers.length];
    }
    const { data: c, error: cErr } = await admin.from('cases').insert({
      case_number: sc.case_number, county: sc.county, status: sc.status, programs: sc.programs,
      application_date: sc.application_date, source: sc.source, intake_mode: sc.intake_mode,
      expedited: !!sc.expedited, assigned_to: assigned,
      applicant_profile_id: sc.linkApplicant ? cp.applicant : null,
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
    // pending_authorization: a TRACKED supervisor task on the case's own SLA clock
    // (0004 BUG-001 — parity with accept_edbc_run's runtime routing; assigned to the
    // in-county supervisor, not the EW).
    if (sc.status === 'pending_authorization') {
      await admin.from('tasks').insert({
        case_id: caseId,
        type: 'Authorize CalWORKs grant',
        priority: sc.expedited ? 'Critical' : 'High',
        due_date: addDays(sc.application_date, sc.expedited ? 3 : 30),
        assigned_to: cp.supervisor,
      });
    }
    if (sc.status === 'renewal_due') {
      await admin.from('tasks').insert({ case_id: caseId, type: 'Renewal (RE) Due', priority: 'Normal', due_date: addDays(new Date().toISOString().slice(0, 10), 10), assigned_to: assigned });
    }

    // engine-computed history: terminal states, and accepted-but-unauthorized (pending_authorization)
    const needsRun = ['approved', 'denied', 'renewal_due'].includes(sc.status) || sc.seedAuth;
    if (needsRun) {
      const out = runEDBC(P, sc.snapshot, sc.programs);
      if (!out.blocked) {
        const anyElig = out.results.some(x => x.status === 'Eligible');
        if (!sc.seedAuth) {
          const trueStatus = sc.status === 'renewal_due' ? (anyElig ? 'renewal_due' : 'denied') : (anyElig ? 'approved' : 'denied');
          if (trueStatus !== sc.status) await admin.from('cases').update({ status: trueStatus }).eq('id', caseId);
        }
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
        if (sc.seedAuth) {
          // accepted, CW-eligible, awaiting supervisor: no notices/issuances yet (those post at authorize)
          await admin.from('journal_entries').insert({
            case_id: caseId, kind: 'EDBC', date: runDate,
            text: `EDBC run — ${out.results.map(x => `${x.program}: ${x.status}${x.amount ? ` $${x.amount}` : ''}`).join('; ')}. Accepted; CalWORKs grant requires supervisor authorization.`,
          });
        } else {
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
    }
    inserted++;
  }
  log.push(`cases seeded: ${inserted}`);

  // ---- 5. post-seed invariant: no orphaned cases (assignee county == case county) ----
  const { data: profRows } = await admin.from('profiles').select('id, county');
  const pcty = new Map((profRows ?? []).map(p => [p.id as string, p.county as string]));
  const { data: caseRows } = await admin.from('cases').select('case_number, county, assigned_to');
  for (const cr of caseRows ?? []) {
    const ac = cr.assigned_to ? pcty.get(cr.assigned_to as string) : null;
    if (!ac || ac !== cr.county) throw new Error(`seed invariant: case ${cr.case_number} (${cr.county}) assigned to ${ac ?? 'nobody'}`);
  }
  log.push('invariant ok: every case assigned in-county');
  return { cases: inserted, accounts: ROSTER.length };
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
