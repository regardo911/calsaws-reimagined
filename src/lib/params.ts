// ============================================================================
// CalSAWS Reimagined — Rule Parameters (defaults + admin registry)
// Verified values from the v1 deep-research pass (CDSS ACIN I-46-25 FFY2026
// CalFresh; MBSAC eff. 2025-07-01; MAP Region 1 non-exempt eff. 2024-10-01;
// LA County GR; CAPI 2026; RCA 4-month window per 2025-05-05 policy change).
// These seed the `rule_params` table; the engine reads a Params object
// assembled from DB rows at run time (see rules.ts).
// ============================================================================

export type SizeTable = Record<number, number>;

export interface Params {
  fpl: SizeTable;
  fplExtra: number;
  cf: {
    grossPct: number; netPct: number; earnedDedPct: number;
    stdDed: SizeTable; sua: number; shelterCap: number; homelessShelterDed: number;
    medThreshold: number; minAllotment: number; allotments: SizeTable; allotExtra: number;
    benefitReductionPct: number; esIncomeMax: number; esResourceMax: number;
  };
  cw: {
    mbsac: SizeTable; mbsacExtra: number; map: SizeTable; mapExtra: number;
    applicantEarnedDisregard: number; disregardFlat: number; disregardPct: number;
    resourceLimit: number; minGrant: number;
  };
  mc: { adultPct: number; childPct: number; pregnantPct: number; agedDisabledPct: number };
  ga: { grant: number; resourceLimit: number };
  capi: {
    standardInd: number; standardCouple: number; genDisregard: number;
    earnedDisregard: number; resourceInd: number; resourceCouple: number;
  };
  rca: { monthsEligible: number };
  sla: Record<string, number>;
  yellowBannerThreshold: number;
}

export const DEFAULT_PARAMS: Params = {
  fpl: { 1: 1305, 2: 1763, 3: 2221, 4: 2680, 5: 3138, 6: 3596, 7: 4055, 8: 4513 },
  fplExtra: 459,
  cf: {
    grossPct: 200, netPct: 100, earnedDedPct: 20,
    stdDed: { 1: 209, 2: 209, 3: 209, 4: 223, 5: 261, 6: 299 },
    sua: 663, shelterCap: 744, homelessShelterDed: 199,
    medThreshold: 35, minAllotment: 24,
    allotments: { 1: 298, 2: 546, 3: 785, 4: 994, 5: 1183, 6: 1421, 7: 1571, 8: 1789 },
    allotExtra: 218, benefitReductionPct: 30, esIncomeMax: 150, esResourceMax: 100,
  },
  cw: {
    mbsac: { 1: 930, 2: 1526, 3: 1892, 4: 2244, 5: 2561, 6: 2880, 7: 3199, 8: 3518 },
    mbsacExtra: 319,
    map: { 1: 734, 2: 930, 3: 1175, 4: 1416, 5: 1646, 6: 1876, 7: 2106, 8: 2336 },
    mapExtra: 230,
    applicantEarnedDisregard: 450, disregardFlat: 600, disregardPct: 50,
    resourceLimit: 12552, minGrant: 10,
  },
  mc: { adultPct: 138, childPct: 266, pregnantPct: 213, agedDisabledPct: 138 },
  ga: { grant: 221, resourceLimit: 100 },
  capi: {
    standardInd: 1233.94, standardCouple: 2098.83, genDisregard: 20,
    earnedDisregard: 65, resourceInd: 2000, resourceCouple: 3000,
  },
  rca: { monthsEligible: 4 },
  sla: { CF: 30, CF_ES: 3, CW: 45, MC: 45, MC_DISABILITY: 90, GA: 30, CAPI: 30, RCA: 30 },
  yellowBannerThreshold: 100,
};

/** Admin > Rules registry: which params surface for live editing. */
export const PARAM_REGISTRY: { path: string; label: string; group: string }[] = [
  { path: 'cf.grossPct', label: 'CalFresh gross income test (% of FPL)', group: 'CalFresh' },
  { path: 'cf.netPct', label: 'CalFresh net income test (% of FPL)', group: 'CalFresh' },
  { path: 'cf.earnedDedPct', label: 'CalFresh earned income deduction (%)', group: 'CalFresh' },
  { path: 'cf.sua', label: 'Standard Utility Allowance ($/mo)', group: 'CalFresh' },
  { path: 'cf.shelterCap', label: 'Excess shelter deduction cap ($/mo)', group: 'CalFresh' },
  { path: 'cf.minAllotment', label: 'Minimum allotment, 1–2 person HH ($)', group: 'CalFresh' },
  { path: 'cf.esIncomeMax', label: 'Expedited Service income ceiling ($/mo)', group: 'CalFresh' },
  { path: 'cf.esResourceMax', label: 'Expedited Service resource ceiling ($)', group: 'CalFresh' },
  { path: 'cw.disregardFlat', label: 'CalWORKs earned income disregard ($ flat)', group: 'CalWORKs' },
  { path: 'cw.disregardPct', label: 'CalWORKs earned disregard (% of remainder)', group: 'CalWORKs' },
  { path: 'cw.applicantEarnedDisregard', label: 'Applicant test disregard per worker ($)', group: 'CalWORKs' },
  { path: 'cw.minGrant', label: 'Minimum grant issued ($)', group: 'CalWORKs' },
  { path: 'mc.adultPct', label: 'Medi-Cal MAGI adult threshold (% FPL)', group: 'Medi-Cal' },
  { path: 'mc.childPct', label: 'Medi-Cal children threshold (% FPL)', group: 'Medi-Cal' },
  { path: 'mc.pregnantPct', label: 'Medi-Cal pregnant threshold (% FPL)', group: 'Medi-Cal' },
  { path: 'ga.grant', label: 'GA/GR monthly grant, single adult ($)', group: 'GA/GR' },
  { path: 'ga.resourceLimit', label: 'GA/GR applicant cash limit ($)', group: 'GA/GR' },
  { path: 'capi.standardInd', label: 'CAPI payment standard, individual ($)', group: 'CAPI' },
  { path: 'rca.monthsEligible', label: 'RCA eligibility window (months since arrival)', group: 'RCA' },
  { path: 'yellowBannerThreshold', label: 'Yellow Banner income discrepancy trigger ($/mo)', group: 'System' },
];

export function cloneParams(): Params {
  return JSON.parse(JSON.stringify(DEFAULT_PARAMS));
}

/** Get a value by dotted path (e.g. "cf.sua"). */
export function getParam(p: Params, path: string): number {
  return path.split('.').reduce((o: any, k) => o?.[k], p);
}

/** Set a value by dotted path, returning a new object. */
export function setParam(p: Params, path: string, value: number): Params {
  const next = JSON.parse(JSON.stringify(p));
  const parts = path.split('.');
  let o: any = next;
  for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
  o[parts[parts.length - 1]] = value;
  return next;
}

/** Flatten the editable registry values of a Params object into rule_params rows. */
export function paramsToRows(p: Params) {
  return PARAM_REGISTRY.map((r) => ({
    path: r.path, value: getParam(p, r.path), label: r.label, grp: r.group,
  }));
}

/** Overlay DB rows onto defaults to build the live Params object. */
export function paramsFromRows(rows: { path: string; value: number }[]): Params {
  let p = cloneParams();
  for (const row of rows) p = setParam(p, row.path, Number(row.value));
  return p;
}
