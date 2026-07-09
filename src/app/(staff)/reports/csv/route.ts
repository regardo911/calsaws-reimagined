// CSV export for the Reports module — staff-gated by proxy + RLS.
// Honors the `tab` query param and mirrors the on-screen report's dataset/columns
// (including month-scoped issuance and county filtering) so the download matches the screen.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadParams } from '@/lib/rules';
import { PROG, slaInfo, type DbCase } from '@/lib/domain';
import type { Program } from '@/lib/engine';

const csvCell = (v: string | number) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (header: string[], rows: (string | number)[][]) =>
  [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n');

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata?.calsaws_role as string) ?? 'applicant';
  if (!user || !['worker', 'supervisor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'staff role required' }, { status: 403 });
  }
  const isAdmin = role === 'admin';
  // Non-admin staff are RLS-scoped to their own county — lock the export to it too.
  const { data: profile } = await supabase.from('profiles').select('county').eq('auth_user_id', user.id).single();
  const county = isAdmin ? (req.nextUrl.searchParams.get('county') ?? 'All') : (profile?.county ?? 'All');
  const tab = req.nextUrl.searchParams.get('tab') ?? 'dash';

  const [{ data: casesAll }, { data: issAll }, { data: tasksAll }, { data: runsAll }, { data: workers }] = await Promise.all([
    supabase.from('cases').select('*'),
    supabase.from('issuances').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('edbc_runs').select('id, case_id, created_at, accepted_by, blocked'),
    supabase.from('profiles').select('*').eq('role', 'worker'),
  ]);
  const cases = (casesAll ?? []).filter(c => county === 'All' || c.county === county);
  const ids = new Set(cases.map(c => c.id));
  const iss = (issAll ?? []).filter(i => ids.has(i.case_id));
  const thisMonth = new Date().toISOString().slice(0, 7);

  let header: string[] = [];
  let rows: (string | number)[][] = [];

  if (tab === 'timeliness') {
    // Overdue queue — the on-screen table (county-scoped).
    const P = await loadParams();
    header = ['Case', 'Task', 'Days over'];
    rows = (tasksAll ?? []).filter(t => t.status === 'open').map(t => {
      const c = cases.find(x => x.id === t.case_id);
      if (!c) return null;
      const sla = slaInfo(c as DbCase, P);
      return sla.overdue ? [c.case_number, t.type, -sla.left] as (string | number)[] : null;
    }).filter(Boolean) as (string | number)[][];
  } else if (tab === 'workers') {
    // Productivity / workload table (county-scoped).
    header = ['Worker', 'Worker ID', 'Caseload', 'Open tasks', 'Determinations'];
    rows = (workers ?? []).filter(w => county === 'All' || w.county === county).map(w => [
      w.full_name, w.worker_id ?? '—',
      cases.filter(c => c.assigned_to === w.id).length,
      (tasksAll ?? []).filter(t => t.status === 'open' && t.assigned_to === w.id && ids.has(t.case_id)).length,
      (runsAll ?? []).filter(r => r.accepted_by === w.id && ids.has(r.case_id)).length,
    ] as (string | number)[]);
  } else if (tab === 'cf296' || tab === 'ca237cw' || tab === 'ca255') {
    const countiesList = [...new Set(cases.map(c => c.county))].sort();
    if (tab === 'cf296') {
      header = ['County', 'Households', 'Persons approx.', 'Issuance ($)'];
      rows = countiesList.map(cty => {
        const cs = cases.filter(c => c.county === cty && (c.programs as Program[]).includes('CF') && c.status === 'approved');
        const issd = iss.filter(i => i.program === 'CF' && i.date.startsWith(thisMonth) && cs.some(c => c.id === i.case_id)).reduce((s, i) => s + Number(i.amount), 0);
        return [cty, cs.length, cs.length * 2, issd] as (string | number)[];
      }).filter(r => (r[1] as number) > 0);
    } else if (tab === 'ca237cw') {
      header = ['County', 'Cases', 'Grants ($)'];
      rows = countiesList.map(cty => {
        const cs = cases.filter(c => c.county === cty && (c.programs as Program[]).includes('CW') && c.status === 'approved');
        const grants = iss.filter(i => i.program === 'CW' && i.date.startsWith(thisMonth) && cs.some(c => c.id === i.case_id)).reduce((s, i) => s + Number(i.amount), 0);
        return [cty, cs.length, grants] as (string | number)[];
      }).filter(r => (r[1] as number) > 0);
    } else {
      header = ['Program', 'Received', 'Approved', 'Denied', 'Pending', 'Renewal due'];
      rows = (['CF', 'CW', 'MC', 'GA', 'CAPI', 'RCA'] as Program[]).map(p => {
        const cs = cases.filter(c => (c.programs as Program[]).includes(p));
        return [PROG[p].name, cs.length, cs.filter(c => c.status === 'approved').length,
          cs.filter(c => c.status === 'denied').length,
          cs.filter(c => ['pending', 'yellow_banner', 'pending_authorization'].includes(c.status)).length,
          cs.filter(c => c.status === 'renewal_due').length] as (string | number)[];
      }).filter(r => (r[1] as number) > 0);
    }
    // Statewide/county total footer — mirrors the on-screen report.
    const totals = header.map((_, i) => i === 0
      ? (county === 'All' ? 'Statewide total' : `${county} total`)
      : rows.reduce((s, r) => s + (typeof r[i] === 'number' ? (r[i] as number) : 0), 0)) as (string | number)[];
    rows.push(totals);
  } else {
    // dash — the live case list behind the dashboard tiles/charts (county-scoped).
    header = ['case_number', 'county', 'programs', 'status', 'applied', 'expedited'];
    rows = cases.map(c => [c.case_number, c.county, (c.programs as Program[]).join('|'), c.status, c.application_date, String(c.expedited)] as (string | number)[]);
  }

  const csv = toCsv(header, rows);
  const label = tab === 'dash' ? 'caseload' : tab;
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="calsaws-${label}-${county.toLowerCase().replace(/\s/g, '-')}.csv"`,
    },
  });
}
