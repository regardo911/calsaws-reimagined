'use server';
// Case workflow server actions. Reads use the caller's RLS-scoped client where
// possible; atomic mutations go through SECURITY DEFINER SQL functions invoked
// with the caller's JWT (so auth.uid() = the real actor and roles are enforced
// at the database). The engine itself runs here on the server.
import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { loadParams } from '@/lib/rules';
import { runEDBC, type EdbcOutput, type Program, fpl } from '@/lib/engine';
import { toSnapshot, type DbCase } from '@/lib/domain';
import { PARAM_REGISTRY } from '@/lib/params';
import { seedAll } from '@/lib/seed-core';

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('authentication required');
  const role = (user.app_metadata?.calsaws_role as string) ?? 'applicant';
  if (!['worker', 'supervisor', 'admin'].includes(role)) throw new Error('staff role required');
  return { supabase, user, role };
}

/** Load a case + children via the service client (staff-only paths check first). */
async function loadCaseGraph(caseId: string) {
  const admin = createAdminClient();
  const [{ data: c }, { data: persons }, { data: income }, { data: resources }, { data: expenses }, { data: matches }] = await Promise.all([
    admin.from('cases').select('*').eq('id', caseId).single(),
    admin.from('persons').select('*').eq('case_id', caseId).order('person_key'),
    admin.from('income_records').select('*').eq('case_id', caseId),
    admin.from('resource_records').select('*').eq('case_id', caseId),
    admin.from('expense_records').select('*').eq('case_id', caseId),
    admin.from('data_matches').select('*').eq('case_id', caseId),
  ]);
  if (!c) throw new Error('case not found');
  return { c: c as DbCase, snapshot: toSnapshot(c as DbCase, persons ?? [], income ?? [], resources ?? [], expenses ?? [], matches ?? []) };
}

export async function runEdbcAction(caseId: string, programs: Program[], benefitMonth: string):
  Promise<{ runId: string; output: EdbcOutput }> {
  const { user } = await requireStaff();
  const { c, snapshot } = await loadCaseGraph(caseId);
  const P = await loadParams();
  const output = runEDBC(P, snapshot, programs.length ? programs : (c.programs as Program[]));

  const admin = createAdminClient();
  const { data: prof } = await admin.from('profiles').select('id').eq('auth_user_id', user.id).single();
  const { data: run, error } = await admin.from('edbc_runs').insert({
    case_id: caseId, benefit_month: benefitMonth || new Date().toISOString().slice(0, 7),
    run_by: prof?.id ?? null, blocked: output.blocked,
  }).select('id').single();
  if (error) throw new Error(error.message);
  if (!output.blocked) {
    const { error: rErr } = await admin.from('edbc_results').insert(output.results.map(res => ({
      run_id: run.id, program: res.program, status: res.status, amount: res.amount,
      aid_code: res.aidCode ?? null, expedited: !!res.expedited,
      reasons: res.reasons, trace: res.trace, members: res.members ?? null,
    })));
    if (rErr) throw new Error(rErr.message);
  } else {
    // an unresolved discrepancy also flips the case to yellow_banner if still pending
    await admin.from('cases').update({ status: 'yellow_banner' }).eq('id', caseId).eq('status', 'pending');
  }
  revalidatePath(`/case/${caseId}`);
  return { runId: run.id, output };
}

export async function acceptEdbcAction(caseId: string, runId: string): Promise<{ status: string }> {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase.rpc('accept_edbc_run', { p_run_id: runId });
  if (error) throw new Error(error.message);
  revalidatePath(`/case/${caseId}`); revalidatePath('/worker'); revalidatePath('/supervisor'); revalidatePath('/reports');
  return { status: data as string };
}

export async function authorizeAction(caseId: string, approve: boolean): Promise<{ status: string }> {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase.rpc('authorize_case', { p_case_id: caseId, p_approve: approve });
  if (error) throw new Error(error.message);
  revalidatePath('/supervisor'); revalidatePath(`/case/${caseId}`); revalidatePath('/reports');
  return { status: data as string };
}

export async function resolveMatchAction(caseId: string, matchId: string, useMatched: boolean, note?: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.rpc('resolve_data_match', { p_match_id: matchId, p_use_matched: useMatched, p_note: note ?? null });
  if (error) throw new Error(error.message);
  revalidatePath(`/case/${caseId}`); revalidatePath('/worker');
  return { ok: true };
}

export async function reassignTaskAction(taskId: string, toProfileId: string) {
  const { supabase } = await requireStaff();
  const { data: task, error } = await supabase.from('tasks')
    .update({ assigned_to: toProfileId }).eq('id', taskId).select('case_id, type').single();
  if (error) throw new Error(error.message);
  await supabase.from('cases').update({ assigned_to: toProfileId }).eq('id', task.case_id);
  const { data: to } = await supabase.from('profiles').select('full_name').eq('id', toProfileId).single();
  await supabase.from('journal_entries').insert({
    case_id: task.case_id, kind: 'Task',
    text: `Task "${task.type}" reassigned to ${to?.full_name ?? 'worker'}.`,
  });
  revalidatePath('/supervisor/team'); revalidatePath('/worker');
  return { ok: true };
}

// ---------- portal ----------
export interface ApplicationPayload {
  persons: { name: string; age: number; employed?: boolean }[];
  monthlyIncome: number; resources: number; rent: number; utilities: number;
  homeless: boolean; programs: Program[]; county: string;
  source?: string; intakeMode?: string;
}

export async function submitApplicationAction(payload: ApplicationPayload):
  Promise<{ caseNumber: string; expedited: boolean } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'auth' };
  const { data, error } = await supabase.rpc('submit_application', {
    p: {
      persons: payload.persons, monthlyIncome: payload.monthlyIncome, resources: payload.resources,
      rent: payload.homeless ? 0 : payload.rent, utilities: payload.homeless ? 0 : payload.utilities,
      flags: { homeless: payload.homeless }, programs: payload.programs, county: payload.county,
      source: payload.source, intakeMode: payload.intakeMode,
    },
  });
  if (error) return { error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  revalidatePath('/worker'); revalidatePath('/portal');
  return { caseNumber: row.case_number as string, expedited: !!row.expedited };
}

export async function prescreenAction(input: { size: number; income: number; kids: boolean; aged: boolean; resources: number }) {
  const P = await loadParams();
  const base = fpl(P, input.size);
  const programs: Program[] = [];
  const notes: string[] = [];
  if (input.income <= base * P.cf.grossPct / 100) {
    programs.push('CF');
    notes.push(`CalFresh gross limit for ${input.size}: $${Math.round(base * P.cf.grossPct / 100).toLocaleString()}/mo`);
  }
  if (input.income < P.cf.esIncomeMax && input.resources <= P.cf.esResourceMax) {
    notes.push('You may qualify for EXPEDITED CalFresh — food benefits within 3 days.');
  }
  if (input.kids && input.income < (P.cw.mbsac[Math.min(input.size, 8)] ?? 3518)) {
    programs.push('CW');
    notes.push('Families with children under the income standard may get monthly cash aid.');
  }
  if (input.income <= base * (input.kids ? P.mc.childPct : P.mc.adultPct) / 100) {
    programs.push('MC');
    notes.push('Health coverage has the highest income limits — most applicants qualify.');
  }
  if (!input.kids && input.size === 1 && input.income < P.ga.grant) programs.push('GA');
  return { programs, notes };
}

// ---------- admin ----------
export async function saveParamsAction(entries: { path: string; value: number }[]) {
  const { supabase, role } = await requireStaff();
  if (role !== 'admin') throw new Error('admin role required');
  const known = new Map(PARAM_REGISTRY.map(r => [r.path, r]));
  const rows = entries.filter(e => known.has(e.path)).map(e => ({
    path: e.path, value: e.value, label: known.get(e.path)!.label, grp: known.get(e.path)!.group,
  }));
  const { error } = await supabase.from('rule_params').upsert(rows, { onConflict: 'path' });
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  return { ok: true, count: rows.length };
}

export async function resetDemoAction() {
  const { role } = await requireStaff();
  if (role !== 'admin') throw new Error('admin role required');
  const admin = createAdminClient();
  const result = await seedAll(admin);
  revalidatePath('/'); revalidatePath('/worker'); revalidatePath('/reports'); revalidatePath('/admin');
  return { ok: true, ...result };
}

// ---------- copilot ----------
export async function copilotAction(q: string, caseNumber?: string): Promise<{ answer: string }> {
  await requireStaff();
  const P = await loadParams();
  const admin = createAdminClient();
  const ql = q.toLowerCase();
  const caseM = q.match(/C-\d{6}/i) || (caseNumber ? [caseNumber] : null);

  if (caseM) {
    const num = caseM[0].toUpperCase();
    const { data: c } = await admin.from('cases').select('*').eq('case_number', num).single();
    if (!c) return { answer: `I can't find case ${num}. Case numbers look like C-100001.` };
    const { snapshot } = await loadCaseGraph(c.id);
    const out = runEDBC(P, snapshot, c.programs as Program[]);
    if (out.blocked) return { answer: `${snapshot.persons[0].name} (${num}) is blocked by a Yellow Banner: ${out.yellowBanner![0].text} Resolve it from the case's Data Matches tab.` };
    const gross = snapshot.income.reduce((s, i) => s + i.amount, 0);
    const lines = out.results.map(r => {
      if (r.status === 'Eligible') {
        const amt = r.amount ? ` for $${r.amount.toLocaleString()}/month` : '';
        return `${r.program}: Eligible${amt}. Passed: ${r.trace.filter(t => t.pass !== null).slice(0, 3).map(t => t.label).join('; ')}.`;
      }
      const fail = r.trace.find(t => t.pass === false);
      return `${r.program}: Ineligible — ${r.reasons[0]?.text ?? ''}${fail ? ` (failed at "${fail.label}")` : ''}`;
    });
    return { answer: `${snapshot.persons[0].name} — household of ${snapshot.persons.length}, gross income $${gross.toLocaleString()}/mo, ${c.county} County.\n\n${lines.join('\n\n')}\n\nOpen the case's EDBC tab for the full step-by-step trace.` };
  }

  const sizeM = ql.match(/(?:family|household|hh)?\s*of\s*(\d+)|(\d+)\s*(?:person|people|member)/);
  const size = sizeM ? +(sizeM[1] || sizeM[2]) : 3;
  if (ql.includes('limit') || ql.includes('fpl') || ql.includes('income')) {
    const base = fpl(P, size);
    return { answer: `For a household of ${size} (FPL $${base.toLocaleString()}/mo):\n• CalFresh: gross ≤ $${Math.round(base * P.cf.grossPct / 100).toLocaleString()} (${P.cf.grossPct}% FPL), net ≤ $${Math.round(base * P.cf.netPct / 100).toLocaleString()}\n• Medi-Cal: adults ≤ $${Math.round(base * P.mc.adultPct / 100).toLocaleString()} (${P.mc.adultPct}%), children ≤ $${Math.round(base * P.mc.childPct / 100).toLocaleString()} (${P.mc.childPct}%)\n• CalWORKs: applicant income below MBSAC $${(P.cw.mbsac[Math.min(size, 8)]).toLocaleString()}\n\nThese are live values from Admin → Rules — change them there and I'll quote the new ones.` };
  }
  if (ql.includes('expedit')) return { answer: `Expedited Service means CalFresh within ${P.sla.CF_ES} days instead of ${P.sla.CF}. A household qualifies if: gross monthly income under $${P.cf.esIncomeMax} AND liquid resources ≤ $${P.cf.esResourceMax}; or housing costs exceed income + resources; or destitute migrant/seasonal farmworker. The engine screens every application automatically — see the ⚡ chips in the queue.` };
  if (ql.includes('yellow')) return { answer: `A Yellow Banner means an external data match (like IEVS wages from EDD) disagrees with the case record by $${P.yellowBannerThreshold}+/month, so EDBC is blocked until a worker reviews it. Resolve it from the case's Data Matches tab — the resolution is journaled automatically. Case C-100005 is seeded with one to try.` };
  if (ql.includes('calworks') || ql.includes('grant') || ql.includes('map')) return { answer: `A CalWORKs grant = MAP − countable income.\n1. Applicant test: earnings minus $${P.cw.applicantEarnedDisregard}/worker + unearned must be under MBSAC.\n2. Disregards: first $${P.cw.disregardFlat} of earnings, then ${P.cw.disregardPct}% of the rest.\n3. Grant = MAP (e.g. $${P.cw.map[3]} for 3, Region 1) − what remains.\n\nExample: $1,600 earnings, family of 3 → $1,600−$600=$1,000, half disregarded → $500 countable → grant $${P.cw.map[3]}−$500 = $${P.cw.map[3] - 500}. Grants route to a supervisor for authorization.` };
  if (ql.includes('sla') || ql.includes('timel')) return { answer: `Processing standards: CalFresh ${P.sla.CF} days (expedited ${P.sla.CF_ES}), CalWORKs ${P.sla.CW}, Medi-Cal ${P.sla.MC} (${P.sla.MC_DISABILITY} disability-based), GA ${P.sla.GA}. The queue shows live countdown chips and Reports → Timeliness tracks the % within SLA.` };
  return { answer: `I can explain any case (try "Explain case C-100001"), quote income limits ("limits for a family of 4"), or walk through policy — expedited service, Yellow Banners, CalWORKs grant math, SLAs.` };
}
