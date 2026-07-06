// Shared domain metadata + helpers (server and client safe — no secrets).
import type { CaseSnapshot, Program } from './engine';
import type { Params } from './params';

export const PROG: Record<Program, { name: string; cssVar: string; desc: string }> = {
  CF: { name: 'CalFresh', cssVar: '--s-cf', desc: 'Food benefits (SNAP)' },
  CW: { name: 'CalWORKs', cssVar: '--s-cw', desc: 'Cash aid for families' },
  MC: { name: 'Medi-Cal', cssVar: '--s-mc', desc: 'Health coverage' },
  GA: { name: 'General Relief', cssVar: '--s-ga', desc: 'County cash aid' },
  CAPI: { name: 'CAPI', cssVar: '--s-capi', desc: 'Cash aid for immigrants' },
  RCA: { name: 'Refugee Cash', cssVar: '--s-rca', desc: 'Refugee assistance' },
};

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'info' },
  yellow_banner: { label: 'Yellow Banner', cls: 'warn' },
  pending_authorization: { label: 'Needs Authorization', cls: 'gold' },
  approved: { label: 'Active', cls: 'ok' },
  denied: { label: 'Denied', cls: 'crit' },
  renewal_due: { label: 'Renewal Due', cls: 'warn' },
};

export const COUNTIES = ['Los Angeles', 'San Diego', 'Alameda', 'Fresno', 'Sacramento', 'Riverside', 'Kern', 'Orange', 'Santa Clara', 'Humboldt'];

export const money = (n: number | null | undefined) => '$' + Number(n || 0).toLocaleString();
export const fdate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export interface DbCase {
  id: string; case_number: string; county: string; status: string; programs: Program[];
  application_date: string; source: string; intake_mode: string; expedited: boolean;
  assigned_to: string | null; applicant_profile_id: string | null;
  golden_tag: string | null; expected_note: string | null;
  flags: { homeless?: boolean; migrantWorker?: boolean }; address: string | null; phone: string | null;
}

export function slaInfo(c: Pick<DbCase, 'application_date' | 'expedited' | 'programs' | 'status'>, P: Params) {
  const applied = new Date(c.application_date + 'T12:00:00');
  const days = c.expedited ? P.sla.CF_ES : Math.min(...c.programs.map(pr => P.sla[pr] ?? 30));
  const due = new Date(applied); due.setDate(due.getDate() + days);
  const left = Math.ceil((due.getTime() - Date.now()) / 86400000);
  return { due: due.toISOString().slice(0, 10), left, days, overdue: left < 0, atRisk: left >= 0 && left <= 5 };
}

/** Assemble the engine snapshot from DB child rows. */
export function toSnapshot(c: DbCase, persons: any[], income: any[], resources: any[], expenses: any[], matches: any[]): CaseSnapshot {
  return {
    persons: persons.map(p => ({
      id: p.person_key, name: p.name, age: p.age, role: p.role,
      citizen: p.citizen, immigrationStatus: p.immigration_status,
      aged: p.aged, disabled: p.disabled, blind: p.blind, pregnant: p.pregnant,
      refugee: p.refugee, arrivalMonthsAgo: p.arrival_months_ago,
      ssiIneligibleImmigration: p.ssi_ineligible_immigration, employed: p.employed,
    })),
    income: income.map(i => ({ personId: i.person_key, kind: i.kind, subtype: i.subtype, amount: Number(i.amount) })),
    resources: resources.map(r => ({ kind: r.kind, label: r.label, value: Number(r.value) })),
    expenses: expenses.map(e => ({ kind: e.kind, amount: Number(e.amount) })),
    flags: (c.flags ?? {}) as CaseSnapshot['flags'],
    dataMatches: matches.map(m => ({ source: m.source, field: m.field, reported: Number(m.reported), matched: Number(m.matched), resolved: m.resolved })),
  };
}
