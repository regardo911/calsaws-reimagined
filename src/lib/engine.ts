// ============================================================================
// CalSAWS Reimagined — EDBC Engine (server-side)
// Direct TypeScript port of the v1 engine (26/26 golden-household assertions).
// Pure and deterministic: same snapshot + params -> same results + traces.
// Runs ONLY on the server; the client never computes a determination.
// ============================================================================
import type { Params } from './params';

export type Program = 'CF' | 'CW' | 'MC' | 'GA' | 'CAPI' | 'RCA';

export interface PersonSnap {
  id: string; name: string; age: number; role: 'primary' | 'member';
  citizen?: boolean; immigrationStatus?: string | null;
  aged?: boolean; disabled?: boolean; blind?: boolean; pregnant?: boolean;
  refugee?: boolean; arrivalMonthsAgo?: number | null;
  ssiIneligibleImmigration?: boolean; employed?: boolean;
}
export interface IncomeSnap { personId: string; kind: 'earned' | 'unearned'; subtype: string; amount: number }
export interface ResourceSnap { kind: 'liquid' | 'vehicle' | 'property'; label?: string; value: number }
export interface ExpenseSnap { kind: 'rent' | 'mortgage' | 'utilities' | 'dependent_care' | 'medical' | 'child_support'; amount: number }
export interface MatchSnap { source: string; field: string; reported: number; matched: number; resolved: boolean }

export interface CaseSnapshot {
  persons: PersonSnap[];
  income: IncomeSnap[];
  resources: ResourceSnap[];
  expenses: ExpenseSnap[];
  flags: { homeless?: boolean; migrantWorker?: boolean };
  dataMatches: MatchSnap[];
}

export interface TraceRow { step: string; label: string; detail: string; value: string | number; pass: boolean | null }
export interface Reason { code: string; text: string }
export interface McMember { personId: string; name: string; category: string; limit: number; eligible: boolean }

export interface ProgramResult {
  program: Program;
  status: 'Eligible' | 'Ineligible';
  amount: number;
  reasons: Reason[];
  trace: TraceRow[];
  expedited?: boolean;
  aidCode?: string;
  members?: McMember[];
  unit?: string;
}

export interface EdbcOutput {
  blocked: boolean;
  yellowBanner: { source: string; field: string; reported: number; matched: number; text: string }[] | null;
  results: ProgramResult[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const money = (n: number) => Math.max(0, r2(n));

export function fpl(P: Params, size: number): number {
  const base = P.fpl[Math.min(size, 8)] ?? P.fpl[8];
  return size > 8 ? base + (size - 8) * P.fplExtra : base;
}
function scaled(table: Record<number, number>, extra: number, size: number): number {
  const capKey = Math.max(...Object.keys(table).map(Number));
  const base = table[Math.min(size, capKey)];
  return size > capKey ? base + (size - capKey) * extra : base;
}

export function totals(snap: CaseSnapshot) {
  const earned = snap.income.filter(i => i.kind === 'earned').reduce((s, i) => s + i.amount, 0);
  const unearned = snap.income.filter(i => i.kind === 'unearned').reduce((s, i) => s + i.amount, 0);
  const liquid = snap.resources.filter(r => r.kind === 'liquid').reduce((s, r) => s + r.value, 0);
  const exp = (k: ExpenseSnap['kind']) => snap.expenses.filter(e => e.kind === k).reduce((s, e) => s + e.amount, 0);
  return {
    earned, unearned, gross: earned + unearned, liquid,
    rent: exp('rent') + exp('mortgage'), utilities: exp('utilities'),
    depCare: exp('dependent_care'), medical: exp('medical'),
  };
}
const size = (snap: CaseSnapshot) => snap.persons.length;
const hasElderlyDisabled = (snap: CaseSnapshot) => snap.persons.some(p => p.aged || p.age >= 60 || p.disabled);
const minors = (snap: CaseSnapshot) => snap.persons.filter(p => p.age < 18);
const adults = (snap: CaseSnapshot) => snap.persons.filter(p => p.age >= 18);

function yellowBanner(P: Params, snap: CaseSnapshot) {
  const hits = (snap.dataMatches || []).filter(m => !m.resolved &&
    Math.abs((m.matched ?? 0) - (m.reported ?? 0)) >= P.yellowBannerThreshold);
  return hits.length ? hits : null;
}

function result(program: Program, status: 'Eligible' | 'Ineligible', amount: number,
  reasons: Reason[], trace: TraceRow[], extra: Partial<ProgramResult>): ProgramResult {
  return { program, status, amount, reasons, trace, ...extra };
}

// ============================== CalFresh ==================================
export function calcCalFresh(P: Params, snap: CaseSnapshot): ProgramResult {
  const T = totals(snap), n = size(snap), C = P.cf;
  const trace: TraceRow[] = [], ed = hasElderlyDisabled(snap);
  const grossLimit = r2(fpl(P, n) * C.grossPct / 100);
  const netLimit = r2(fpl(P, n) * C.netPct / 100);
  const reasons: Reason[] = [];

  const shelterTotal = T.rent + T.utilities;
  const expedited = (T.gross < C.esIncomeMax && T.liquid <= C.esResourceMax)
    || (shelterTotal > T.gross + T.liquid)
    || !!snap.flags?.migrantWorker;
  trace.push({ step: 'ES', label: 'Expedited Service screen',
    detail: `Gross $${T.gross} < $${C.esIncomeMax} and liquid $${T.liquid} ≤ $${C.esResourceMax}? ` +
      `Or shelter $${shelterTotal} > income+resources $${T.gross + T.liquid}? Or destitute migrant worker?`,
    value: expedited ? 'YES — 3-day service' : 'No', pass: expedited ? true : null });

  if (!ed) {
    const pass = T.gross <= grossLimit;
    trace.push({ step: 'G1', label: `Gross income test (≤ ${C.grossPct}% FPL)`,
      detail: `Gross $${T.gross} vs limit $${grossLimit} (household of ${n})`, value: `$${T.gross}`, pass });
    if (!pass) {
      reasons.push({ code: 'CF-G01', text: `Gross income $${T.gross} exceeds ${C.grossPct}% FPL limit of $${grossLimit} for a household of ${n}.` });
      return result('CF', 'Ineligible', 0, reasons, trace, { expedited });
    }
  } else {
    trace.push({ step: 'G1', label: 'Gross income test', detail: 'Waived — elderly (60+)/disabled household; net test only.', value: 'waived', pass: null });
  }

  let net = T.gross;
  const earnedDed = r2(T.earned * C.earnedDedPct / 100);
  net -= earnedDed;
  trace.push({ step: 'D1', label: `Earned income deduction (${C.earnedDedPct}%)`, detail: `$${T.earned} earned × ${C.earnedDedPct}%`, value: `−$${earnedDed}`, pass: null });
  const std = C.stdDed[Math.min(n, 6)];
  net -= std;
  trace.push({ step: 'D2', label: 'Standard deduction', detail: `Household size ${n}`, value: `−$${std}`, pass: null });
  if (T.depCare > 0) { net -= T.depCare; trace.push({ step: 'D3', label: 'Dependent care deduction', detail: 'Actual costs', value: `−$${T.depCare}`, pass: null }); }
  if (ed && T.medical > C.medThreshold) {
    const med = r2(T.medical - C.medThreshold);
    net -= med;
    trace.push({ step: 'D4', label: 'Medical deduction (elderly/disabled)', detail: `$${T.medical} − $${C.medThreshold} threshold`, value: `−$${med}`, pass: null });
  }
  if (snap.flags?.homeless && T.rent + T.utilities === 0) {
    net -= C.homelessShelterDed;
    trace.push({ step: 'D5', label: 'Homeless shelter deduction', detail: 'Standard homeless deduction', value: `−$${C.homelessShelterDed}`, pass: null });
  } else if (T.rent + T.utilities > 0) {
    const shelter = T.rent + (T.utilities > 0 ? C.sua : 0);
    const half = r2(Math.max(0, net) / 2);
    let excess = r2(Math.max(0, shelter - half));
    const capped = !ed && excess > C.shelterCap;
    if (capped) excess = C.shelterCap;
    net -= excess;
    trace.push({ step: 'D5', label: 'Excess shelter deduction',
      detail: `Shelter $${T.rent} rent + $${T.utilities > 0 ? C.sua : 0} SUA = $${shelter}; minus half of adjusted income $${half}` + (capped ? `; capped at $${C.shelterCap}` : ''),
      value: `−$${excess}`, pass: null });
  }
  net = money(net);

  const netPass = net <= netLimit;
  trace.push({ step: 'N1', label: `Net income test (≤ ${C.netPct}% FPL)`, detail: `Net $${net} vs limit $${netLimit}`, value: `$${net}`, pass: netPass });
  if (!netPass) {
    reasons.push({ code: 'CF-N01', text: `Net income $${net} exceeds ${C.netPct}% FPL limit of $${netLimit}.` });
    return result('CF', 'Ineligible', 0, reasons, trace, { expedited });
  }

  const maxAllot = scaled(C.allotments, C.allotExtra, n);
  const reduction = Math.ceil(net * C.benefitReductionPct / 100);
  let allot = maxAllot - reduction;
  trace.push({ step: 'B1', label: 'Benefit calculation', detail: `Max allotment $${maxAllot} (HH ${n}) − ${C.benefitReductionPct}% of net income ($${reduction})`, value: `$${allot}`, pass: null });
  if (allot <= 0 && n <= 2) { allot = C.minAllotment; trace.push({ step: 'B2', label: 'Minimum allotment', detail: '1–2 person eligible household floor', value: `$${allot}`, pass: null }); }
  if (allot <= 0) {
    reasons.push({ code: 'CF-B01', text: 'Calculated allotment is $0.' });
    return result('CF', 'Ineligible', 0, reasons, trace, { expedited });
  }
  reasons.push({ code: 'CF-A01', text: `Eligible for CalFresh. Monthly allotment $${allot}${expedited ? ' — EXPEDITED (3-day) service required' : ''}.` });
  return result('CF', 'Eligible', allot, reasons, trace, { expedited, aidCode: '09' });
}

// ============================== CalWORKs ==================================
export function calcCalWORKs(P: Params, snap: CaseSnapshot): ProgramResult {
  const T = totals(snap), C = P.cw, trace: TraceRow[] = [], reasons: Reason[] = [];
  const kids = minors(snap);
  const au = size(snap);

  const hasChild = kids.length > 0 || snap.persons.some(p => p.pregnant);
  trace.push({ step: 'NF1', label: 'Deprivation / minor child in home', detail: `${kids.length} child(ren) under 18${snap.persons.some(p => p.pregnant) ? ' (or pregnant person)' : ''}`, value: hasChild ? 'Yes' : 'No', pass: hasChild });
  if (!hasChild) {
    reasons.push({ code: 'CW-NF1', text: 'No eligible child under 18 (or pregnant person) in the home. CalWORKs requires a minor child.' });
    return result('CW', 'Ineligible', 0, reasons, trace, {});
  }

  const workers = snap.persons.filter(p => p.employed).length || (T.earned > 0 ? 1 : 0);
  const applicantNet = money(T.earned - workers * C.applicantEarnedDisregard) + T.unearned;
  const mbsac = scaled(C.mbsac, C.mbsacExtra, au);
  const appPass = applicantNet < mbsac;
  trace.push({ step: 'A1', label: 'Applicant income test (vs MBSAC)', detail: `Earned $${T.earned} − $${C.applicantEarnedDisregard}×${workers} worker(s) + unearned $${T.unearned} = $${applicantNet} vs MBSAC $${mbsac} (AU ${au})`, value: `$${applicantNet}`, pass: appPass });
  if (!appPass) {
    reasons.push({ code: 'CW-A01', text: `Applicant income $${applicantNet} is not below MBSAC $${mbsac} for an assistance unit of ${au}.` });
    return result('CW', 'Ineligible', 0, reasons, trace, {});
  }

  const afterFlat = Math.max(0, T.earned - C.disregardFlat);
  const countableEarned = r2(afterFlat * (100 - C.disregardPct) / 100);
  trace.push({ step: 'G1', label: 'Earned income disregards', detail: `$${T.earned} − $${C.disregardFlat} flat = $${afterFlat}; ${C.disregardPct}% of remainder disregarded`, value: `countable $${countableEarned}`, pass: null });
  const netNonexempt = r2(countableEarned + T.unearned);
  const map = scaled(C.map, C.mapExtra, au);
  const grant = Math.floor(map - netNonexempt);
  trace.push({ step: 'G2', label: 'Grant computation', detail: `MAP $${map} (AU ${au}, Region 1) − net nonexempt income $${netNonexempt}`, value: `$${Math.max(0, grant)}`, pass: grant >= C.minGrant });
  if (grant < C.minGrant) {
    reasons.push({ code: 'CW-G01', text: `Computed grant $${Math.max(0, grant)} is below the $${C.minGrant} minimum — financially ineligible.` });
    return result('CW', 'Ineligible', 0, reasons, trace, {});
  }
  reasons.push({ code: 'CW-A02', text: `Eligible for CalWORKs. Monthly grant $${grant} (MAP $${map} − countable income $${netNonexempt}).` });
  return result('CW', 'Eligible', grant, reasons, trace, { aidCode: '30' });
}

// ============================== Medi-Cal ==================================
export function calcMediCal(P: Params, snap: CaseSnapshot): ProgramResult {
  const T = totals(snap), C = P.mc, n = size(snap), trace: TraceRow[] = [], reasons: Reason[] = [];
  const base = fpl(P, n);
  const magi = T.gross;
  trace.push({ step: 'M0', label: 'MAGI household income', detail: `Countable monthly income, household of ${n}`, value: `$${magi}`, pass: null });

  const members: McMember[] = snap.persons.map(p => {
    let category: string, limit: number;
    if (p.pregnant) { category = 'MAGI Pregnant'; limit = r2(base * C.pregnantPct / 100); }
    else if (p.age < 19) { category = 'MAGI Child'; limit = r2(base * C.childPct / 100); }
    else if (p.aged || p.age >= 65 || p.disabled) { category = 'Non-MAGI Aged/Disabled'; limit = r2(base * C.agedDisabledPct / 100); }
    else { category = 'MAGI Adult'; limit = r2(base * C.adultPct / 100); }
    const eligible = magi <= limit;
    trace.push({ step: 'M1', label: `${p.name} — ${category}`, detail: `Income $${magi} vs ${category} limit $${limit}`, value: eligible ? 'Eligible' : 'Over income', pass: eligible });
    return { personId: p.id, name: p.name, category, limit, eligible };
  });

  const eligCount = members.filter(m => m.eligible).length;
  if (eligCount === 0) {
    reasons.push({ code: 'MC-I01', text: `No household member is income-eligible for Medi-Cal at $${magi}/month.` });
    return result('MC', 'Ineligible', 0, reasons, trace, { members });
  }
  const cats = [...new Set(members.filter(m => m.eligible).map(m => m.category))].join(', ');
  reasons.push({ code: 'MC-A01', text: `${eligCount} of ${n} household member(s) eligible for Medi-Cal (${cats}).` });
  return result('MC', 'Eligible', 0, reasons, trace, { members, unit: 'coverage', aidCode: eligCount === n ? 'M1' : 'M2' });
}

// ============================== GA / GR ===================================
export function calcGA(P: Params, snap: CaseSnapshot): ProgramResult {
  const T = totals(snap), C = P.ga, trace: TraceRow[] = [], reasons: Reason[] = [];
  const kids = minors(snap);
  const okComp = kids.length === 0 && adults(snap).length >= 1;
  trace.push({ step: 'C1', label: 'Household composition', detail: 'GA/GR serves indigent adults not eligible for other cash aid (no minor children)', value: okComp ? 'Adult-only household' : 'Has minor children', pass: okComp });
  if (!okComp) {
    reasons.push({ code: 'GA-C01', text: 'Household includes minor children — refer to CalWORKs instead of GA/GR.' });
    return result('GA', 'Ineligible', 0, reasons, trace, {});
  }
  const incomePass = T.gross < C.grant;
  trace.push({ step: 'I1', label: 'Income test', detail: `Gross $${T.gross} vs grant standard $${C.grant}`, value: `$${T.gross}`, pass: incomePass });
  const resPass = T.liquid <= C.resourceLimit;
  trace.push({ step: 'R1', label: 'Resource test', detail: `Liquid resources $${T.liquid} vs limit $${C.resourceLimit}`, value: `$${T.liquid}`, pass: resPass });
  if (!incomePass || !resPass) {
    if (!incomePass) reasons.push({ code: 'GA-I01', text: `Income $${T.gross} is not below the GA/GR grant standard $${C.grant}.` });
    if (!resPass) reasons.push({ code: 'GA-R01', text: `Liquid resources $${T.liquid} exceed the $${C.resourceLimit} limit.` });
    return result('GA', 'Ineligible', 0, reasons, trace, {});
  }
  const grant = Math.floor(C.grant - T.gross);
  reasons.push({ code: 'GA-A01', text: `Eligible for General Relief. Monthly grant $${grant}.` });
  return result('GA', 'Eligible', grant, reasons, trace, { aidCode: '90' });
}

// ================================ CAPI =====================================
export function calcCAPI(P: Params, snap: CaseSnapshot): ProgramResult {
  const T = totals(snap), C = P.capi, trace: TraceRow[] = [], reasons: Reason[] = [];
  const p = snap.persons.find(x => x.role === 'primary') || snap.persons[0];
  const catOk = !!(p.aged || p.age >= 65 || p.blind || p.disabled);
  trace.push({ step: 'C1', label: 'Categorical: aged 65+/blind/disabled', detail: `${p.name}, age ${p.age}${p.disabled ? ', disabled' : ''}${p.blind ? ', blind' : ''}`, value: catOk ? 'Yes' : 'No', pass: catOk });
  const immOk = !p.citizen && !!p.ssiIneligibleImmigration;
  trace.push({ step: 'C2', label: 'Non-citizen ineligible for SSI solely due to immigration status', detail: 'CAPI covers immigrants excluded from SSI', value: immOk ? 'Yes' : 'No', pass: immOk });
  if (!catOk || !immOk) {
    reasons.push({ code: 'CAPI-C01', text: 'Does not meet CAPI categorical/immigration criteria.' });
    return result('CAPI', 'Ineligible', 0, reasons, trace, {});
  }
  const resPass = T.liquid <= C.resourceInd;
  trace.push({ step: 'R1', label: 'Resource test (SSI rules)', detail: `Liquid $${T.liquid} vs $${C.resourceInd} individual limit`, value: `$${T.liquid}`, pass: resPass });
  if (!resPass) {
    reasons.push({ code: 'CAPI-R01', text: `Resources $${T.liquid} exceed the $${C.resourceInd} limit.` });
    return result('CAPI', 'Ineligible', 0, reasons, trace, {});
  }
  const countUnearned = Math.max(0, T.unearned - C.genDisregard);
  const countEarned = r2(Math.max(0, T.earned - C.earnedDisregard) / 2);
  const countable = r2(countUnearned + countEarned);
  trace.push({ step: 'I1', label: 'Countable income (SSI methodology)', detail: `Unearned $${T.unearned} − $${C.genDisregard}; earned ($${T.earned} − $${C.earnedDisregard}) ÷ 2`, value: `$${countable}`, pass: countable < C.standardInd });
  if (countable >= C.standardInd) {
    reasons.push({ code: 'CAPI-I01', text: `Countable income $${countable} meets or exceeds the $${C.standardInd} payment standard.` });
    return result('CAPI', 'Ineligible', 0, reasons, trace, {});
  }
  const benefit = Math.floor(C.standardInd - countable);
  reasons.push({ code: 'CAPI-A01', text: `Eligible for CAPI. Monthly payment $${benefit} ($${C.standardInd} standard − $${countable} countable income).` });
  return result('CAPI', 'Eligible', benefit, reasons, trace, { aidCode: '18' });
}

// ================================= RCA =====================================
export function calcRCA(P: Params, snap: CaseSnapshot): ProgramResult {
  const C = P.rca, trace: TraceRow[] = [], reasons: Reason[] = [];
  const p = snap.persons.find(x => x.refugee) || null;
  trace.push({ step: 'C1', label: 'Refugee status', detail: p ? `${p.name} holds refugee/asylee status` : 'No household member with refugee status', value: p ? 'Yes' : 'No', pass: !!p });
  if (!p) { reasons.push({ code: 'RCA-C01', text: 'No household member with refugee/asylee status.' }); return result('RCA', 'Ineligible', 0, reasons, trace, {}); }
  const within = (p.arrivalMonthsAgo ?? 999) <= C.monthsEligible;
  trace.push({ step: 'C2', label: `Within ${C.monthsEligible} months of U.S. arrival`, detail: `Arrived ${p.arrivalMonthsAgo} month(s) ago`, value: within ? 'Yes' : 'No', pass: within });
  if (!within) { reasons.push({ code: 'RCA-C02', text: `Arrival ${p.arrivalMonthsAgo} months ago is outside the ${C.monthsEligible}-month RCA window.` }); return result('RCA', 'Ineligible', 0, reasons, trace, {}); }
  const T = totals(snap);
  const std = P.cw.map[1];
  const pass = T.gross < std;
  trace.push({ step: 'I1', label: 'Income test (vs cash standard)', detail: `Gross $${T.gross} vs $${std}`, value: `$${T.gross}`, pass });
  if (!pass) { reasons.push({ code: 'RCA-I01', text: `Income $${T.gross} is not below the cash standard $${std}.` }); return result('RCA', 'Ineligible', 0, reasons, trace, {}); }
  const benefit = Math.floor(std - T.gross);
  reasons.push({ code: 'RCA-A01', text: `Eligible for Refugee Cash Assistance. Monthly payment $${benefit}.` });
  return result('RCA', 'Eligible', benefit, reasons, trace, { aidCode: '01' });
}
// (rcaIncome helper folded into calcRCA above)

// ---- entry point ----
const CALCS: Record<Program, (P: Params, s: CaseSnapshot) => ProgramResult> = {
  CF: calcCalFresh, CW: calcCalWORKs, MC: calcMediCal, GA: calcGA, CAPI: calcCAPI, RCA: calcRCA,
};

export function runEDBC(P: Params, snap: CaseSnapshot, programs: Program[]): EdbcOutput {
  const banner = yellowBanner(P, snap);
  if (banner) {
    return {
      blocked: true,
      yellowBanner: banner.map(m => ({
        source: m.source, field: m.field, reported: m.reported, matched: m.matched,
        text: `${m.source} reports ${m.field} of $${m.matched}/mo but the case records $${m.reported}/mo. Review and resolve before EDBC can be accepted.`,
      })),
      results: [],
    };
  }
  const results = programs.filter(p => CALCS[p]).map(p => CALCS[p](P, snap));
  return { blocked: false, yellowBanner: null, results };
}

/** Expedited screening used at intake (before any EDBC run). */
export function screenExpedited(P: Params, snap: CaseSnapshot, programs: Program[]): boolean {
  if (!programs.includes('CF')) return false;
  const T = totals(snap);
  return (T.gross < P.cf.esIncomeMax && T.liquid <= P.cf.esResourceMax)
    || (T.rent + T.utilities > T.gross + T.liquid);
}
