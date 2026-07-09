// Reports & analytics — computed live from Postgres on every render.
// Charts follow the validated dataviz spec (program colors = categorical slots,
// direct labels, single axis).
import Link from 'next/link';
import { getStaffContext } from '@/lib/auth-helpers';
import { loadParams } from '@/lib/rules';
import { money, PROG, slaInfo, type DbCase } from '@/lib/domain';
import { Tile } from '@/components/ui';
import type { Program } from '@/lib/engine';

export const dynamic = 'force-dynamic';

const TABS = [['dash', 'Live dashboard'], ['timeliness', 'Timeliness'], ['workers', 'Productivity'], ['cf296', 'CF 296'], ['ca237cw', 'CA 237 CW'], ['ca255', 'CA 255']] as const;
const PVAR: Record<Program, string> = { CF: '--s-cf', CW: '--s-cw', MC: '--s-mc', GA: '--s-ga', CAPI: '--s-capi', RCA: '--s-rca' };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tab?: string; county?: string }> }) {
  const { tab = 'dash', county: countyParam = 'All' } = await searchParams;
  const { supabase, profile } = await getStaffContext();
  const isAdmin = profile.role === 'admin';
  // Non-admin staff are RLS-scoped to a single county — lock the filter + labels to it.
  const county = isAdmin ? countyParam : profile.county;
  const P = await loadParams();

  const [{ data: casesAll }, { data: issAll }, { data: tasksAll }, { data: runsAll }, { data: workers }] = await Promise.all([
    supabase.from('cases').select('*'),
    supabase.from('issuances').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('edbc_runs').select('id, case_id, created_at, accepted_by, blocked'),
    supabase.from('profiles').select('*').eq('role', 'worker'),
  ]);
  const counties = ['All', ...new Set((casesAll ?? []).map(c => c.county))];
  const cases = (casesAll ?? []).filter(c => county === 'All' || c.county === county);
  const ids = new Set(cases.map(c => c.id));
  const iss = (issAll ?? []).filter(i => ids.has(i.case_id));
  const thisMonth = new Date().toISOString().slice(0, 7);

  return (
    <>
      <div className="row wrap" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <h1 style={{ fontSize: 23 }}>Reports & analytics</h1>
        <div className="row wrap">
          {isAdmin ? (
            <form method="get" action="/reports" className="row">
              <input type="hidden" name="tab" value={tab} />
              <select className="in" name="county" defaultValue={county} style={{ width: 'auto' }} aria-label="County filter">
                {counties.map(c => <option key={c}>{c}</option>)}
              </select>
              <button className="btn ghost sm" type="submit">Filter</button>
            </form>
          ) : (
            <select className="in" defaultValue={county} disabled style={{ width: 'auto' }} aria-label="County filter">
              <option>{county}</option>
            </select>
          )}
          <a className="btn ghost sm" href={`/reports/csv?tab=${tab}&county=${encodeURIComponent(county)}`}>⬇ Export CSV</a>
        </div>
      </div>
      <p className="muted small" style={{ marginBottom: 14 }}>
        Computed live from the database — every determination anyone runs moves these numbers.
        Legacy equivalent: overnight batch + month-end print reports.
      </p>
      <div className="tabs" style={{ marginBottom: 18 }}>
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/reports?tab=${k}&county=${encodeURIComponent(county)}`}
            style={{ textDecoration: 'none', padding: '10px 15px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', color: tab === k ? 'var(--primary)' : 'var(--ink-2)', borderBottom: tab === k ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: -2 }}>
            {l}
          </Link>
        ))}
      </div>

      {tab === 'dash' && (() => {
        const active = cases.filter(c => c.status === 'approved');
        const pend = cases.filter(c => ['pending', 'yellow_banner', 'pending_authorization'].includes(c.status));
        const issMonth = iss.filter(i => i.date.startsWith(thisMonth)).reduce((s, i) => s + Number(i.amount), 0);
        const byProg = (['CF', 'CW', 'MC', 'GA', 'CAPI', 'RCA'] as Program[]).map(p => ({
          label: p, value: cases.filter(c => (c.programs as Program[]).includes(p) && c.status === 'approved').length, cssVar: PVAR[p],
        }));
        const byCounty = [...new Set(cases.map(c => c.county))]
          .map(cty => ({ label: cty, value: cases.filter(c => c.county === cty).length }))
          .sort((a, b) => b.value - a.value).slice(0, 8);
        const issByProg = (['CF', 'CW', 'GA', 'CAPI', 'RCA'] as Program[]).map(p => ({
          label: p, value: iss.filter(i => i.program === p && i.date.startsWith(thisMonth)).reduce((s, i) => s + Number(i.amount), 0), cssVar: PVAR[p],
        })).filter(d => d.value > 0);
        return (
          <>
            <div className="grid g4" style={{ marginBottom: 18 }} data-testid="report-tiles">
              <Tile v={cases.length} l="Total cases" />
              <Tile v={active.length} l="Active benefit cases" />
              <Tile v={pend.length} l="In processing" />
              <Tile v={money(issMonth)} l="Issued this month (EBT)" />
            </div>
            <div className="grid g2">
              <ChartCard title="Active cases by program"><BarsV data={byProg} /></ChartCard>
              <ChartCard title="Caseload by county"><BarsH data={byCounty} /></ChartCard>
              <ChartCard title="Benefits issued this month by program">
                {issByProg.length ? <BarsV data={issByProg} fmt={(v) => '$' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(v))} /> : <p className="muted small">No issuances this month in the current filter.</p>}
              </ChartCard>
              <ChartCard title="Legend">
                <div className="legend" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  {(Object.keys(PVAR) as Program[]).map(p => (
                    <span key={p}><span className="sw" style={{ background: `var(${PVAR[p]})` }} />{PROG[p].name}</span>
                  ))}
                </div>
              </ChartCard>
            </div>
          </>
        );
      })()}

      {tab === 'timeliness' && (() => {
        const runsByCase = new Map<string, string>();
        (runsAll ?? []).filter(r => !r.blocked).forEach(r => {
          const cur = runsByCase.get(r.case_id);
          if (!cur || r.created_at < cur) runsByCase.set(r.case_id, r.created_at);
        });
        const rows = (['CF', 'CW', 'MC', 'GA'] as Program[]).map(p => {
          const done = cases.filter(c => (c.programs as Program[]).includes(p) && runsByCase.has(c.id));
          if (!done.length) return null;
          const within = done.filter(c => {
            const days = (new Date(runsByCase.get(c.id)!).getTime() - new Date(c.application_date).getTime()) / 86400000;
            return days <= (P.sla[p] ?? 30);
          });
          const pct = Math.round(100 * within.length / done.length);
          return { label: `${PROG[p].name} (${P.sla[p]}d)`, value: pct, color: pct >= 90 ? 'var(--ok)' : pct >= 75 ? 'var(--warn)' : 'var(--crit)' };
        }).filter(Boolean) as { label: string; value: number; color: string }[];
        const overdue = (tasksAll ?? []).filter(t => t.status === 'open').map(t => {
          const c = cases.find(x => x.id === t.case_id);
          if (!c) return null;
          const sla = slaInfo(c as DbCase, P);
          return sla.overdue ? { t, c, sla } : null;
        }).filter(Boolean) as { t: { id: string; type: string }; c: { id: string; case_number: string }; sla: { left: number } }[];
        return (
          <div className="grid g2">
            <ChartCard title="% of applications processed within SLA" sub="target ≥ 90%">
              {rows.length ? <BarsH data={rows} fmt={(v) => v + '%'} /> : <p className="muted">No processed applications in filter.</p>}
              <div className="legend" style={{ marginTop: 10 }}>
                <span><span className="sw" style={{ background: 'var(--ok)' }} />≥90% on target</span>
                <span><span className="sw" style={{ background: 'var(--warn)' }} />75–89%</span>
                <span><span className="sw" style={{ background: 'var(--crit)' }} />&lt;75% corrective action</span>
              </div>
            </ChartCard>
            <div className="card"><div className="hd"><h3 style={{ fontSize: 15 }}>Overdue queue</h3></div>
              <div className="tblwrap"><table className="tbl">
                <thead><tr><th>Case</th><th>Task</th><th>Days over</th><th></th></tr></thead>
                <tbody>
                  {overdue.map(({ t, c, sla }) => (
                    <tr key={t.id}><td className="mono">{c.case_number}</td><td>{t.type}</td>
                      <td><span className="pill crit">{-sla.left}d</span></td>
                      <td><Link className="btn ghost sm" href={`/case/${c.id}`}>Open</Link></td></tr>
                  ))}
                  {overdue.length === 0 && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 18 }}>✅ Nothing overdue</td></tr>}
                </tbody>
              </table></div></div>
          </div>
        );
      })()}

      {tab === 'workers' && (() => {
        const rows = (workers ?? []).filter(w => county === 'All' || w.county === county).map(w => ({
          w,
          open: (tasksAll ?? []).filter(t => t.status === 'open' && t.assigned_to === w.id && ids.has(t.case_id)).length,
          dets: (runsAll ?? []).filter(r => r.accepted_by === w.id && ids.has(r.case_id)).length,
          cl: cases.filter(c => c.assigned_to === w.id).length,
        }));
        return (
          <div className="grid g2">
            <ChartCard title="Determinations completed"><BarsH data={rows.map(r => ({ label: r.w.full_name, value: r.dets }))} /></ChartCard>
            <div className="card"><div className="hd"><h3 style={{ fontSize: 15 }}>Workload</h3></div>
              <div className="tblwrap"><table className="tbl">
                <thead><tr><th>Worker</th><th>Worker ID</th><th className="r">Caseload</th><th className="r">Open tasks</th><th className="r">Determinations</th></tr></thead>
                <tbody>{rows.map(r => (
                  <tr key={r.w.id}><td><strong>{r.w.full_name}</strong></td><td className="mono small">{r.w.worker_id ?? '—'}</td>
                    <td className="r num">{r.cl}</td><td className="r num">{r.open}</td><td className="r num">{r.dets}</td></tr>
                ))}</tbody>
              </table></div></div>
          </div>
        );
      })()}

      {['cf296', 'ca237cw', 'ca255'].includes(tab) && (() => {
        const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const countiesList = [...new Set(cases.map(c => c.county))].sort();
        let title = '', sub = '', head: string[] = [], rows: (string | number)[][] = [];
        if (tab === 'cf296') {
          title = 'CF 296 — CalFresh Monthly Caseload Movement Report';
          sub = 'Participation and issuance by county · replaced the DFA 296 (July 2016) · scheduled 2nd business day';
          head = ['County', 'Households', 'Persons approx.', 'Issuance ($)'];
          rows = countiesList.map(cty => {
            const cs = cases.filter(c => c.county === cty && (c.programs as Program[]).includes('CF') && c.status === 'approved');
            const issd = iss.filter(i => i.program === 'CF' && i.date.startsWith(thisMonth) && cs.some(c => c.id === i.case_id)).reduce((s, i) => s + Number(i.amount), 0);
            return [cty, cs.length, cs.length * 2, issd] as (string | number)[];
          }).filter(r => (r[1] as number) > 0);
        } else if (tab === 'ca237cw') {
          title = 'CA 237 CW — CalWORKs Caseload Movement Report';
          sub = 'Cash grant caseload movement by county · scheduled 7th business day';
          head = ['County', 'Cases', 'Grants ($)'];
          rows = countiesList.map(cty => {
            const cs = cases.filter(c => c.county === cty && (c.programs as Program[]).includes('CW') && c.status === 'approved');
            const grants = iss.filter(i => i.program === 'CW' && i.date.startsWith(thisMonth) && cs.some(c => c.id === i.case_id)).reduce((s, i) => s + Number(i.amount), 0);
            return [cty, cs.length, grants] as (string | number)[];
          }).filter(r => (r[1] as number) > 0);
        } else {
          title = 'CA 255 — Denials and Other Non-Approvals Report';
          sub = 'Application dispositions by program · companion to CA 237 · scheduled 7th business day';
          head = ['Program', 'Received', 'Approved', 'Denied', 'Pending', 'Renewal due'];
          rows = (['CF', 'CW', 'MC', 'GA', 'CAPI', 'RCA'] as Program[]).map(p => {
            const cs = cases.filter(c => (c.programs as Program[]).includes(p));
            return [PROG[p].name, cs.length, cs.filter(c => c.status === 'approved').length,
              cs.filter(c => c.status === 'denied').length,
              cs.filter(c => ['pending', 'yellow_banner', 'pending_authorization'].includes(c.status)).length,
              cs.filter(c => c.status === 'renewal_due').length] as (string | number)[];
          }).filter(r => (r[1] as number) > 0);
        }
        const totals = head.map((_, i) => i === 0 ? (county === 'All' ? 'Statewide total' : `${county} total`) : rows.reduce((s, r) => s + (typeof r[i] === 'number' ? (r[i] as number) : 0), 0));
        return (
          <div className="card"><div className="bd">
            <div style={{ borderBottom: '3px solid var(--primary-strong)', paddingBottom: 12, marginBottom: 4 }}>
              <div className="eyebrow">State of California · Health & Human Services · CalSAWS Reimagined</div>
              <h2 style={{ fontSize: 18, marginTop: 4 }}>{title}</h2>
              <p className="small muted">{sub} · Report month: {month} · {county === 'All' ? 'All counties' : county}</p>
            </div>
            <div className="tblwrap"><table className="tbl">
              <thead><tr>{head.map((h, i) => <th key={h} className={i ? 'r' : ''}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r, ri) => <tr key={ri}>{r.map((v, i) => <td key={i} className={i ? 'r num' : ''}>{i && head[i].includes('$') ? money(v as number) : typeof v === 'number' ? v.toLocaleString() : v}</td>)}</tr>)}
                <tr style={{ fontWeight: 750 }}>{totals.map((v, i) => <td key={i} className={i ? 'r num' : ''}>{i && head[i].includes('$') ? money(v as number) : typeof v === 'number' ? v.toLocaleString() : v}</td>)}</tr>
              </tbody>
            </table></div>
            <p className="xs muted" style={{ marginTop: 12 }}>Generated on demand from live case data · synthetic caseload · export with the CSV button above.</p>
          </div></div>
        );
      })()}
    </>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="hd"><h3 style={{ fontSize: 15 }}>{title}</h3>{sub && <span className="xs muted">{sub}</span>}</div>
      <div className="bd">{children}</div>
    </div>
  );
}

function BarsV({ data, fmt = (v: number) => String(v) }: { data: { label: string; value: number; cssVar?: string }[]; fmt?: (v: number) => string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = Math.max(320, data.length * 86), h = 190, bw = 34;
  return (
    <svg className="viz" viewBox={`0 0 ${W} ${h}`} role="img">
      <line className="grid" x1={24} x2={W - 8} y1={h - 30} y2={h - 30} strokeWidth={1} stroke="var(--line)" />
      {data.map((d, i) => {
        const x = 30 + i * ((W - 40) / data.length) + ((W - 40) / data.length - bw) / 2;
        const bh = Math.max(3, (d.value / max) * (h - 58));
        const y = h - 30 - bh;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={bw} height={bh} rx={4} fill={d.cssVar ? `var(${d.cssVar})` : 'var(--seq-4)'} />
            <text className="dl" x={x + bw / 2} y={y - 7} textAnchor="middle">{fmt(d.value)}</text>
            <text x={x + bw / 2} y={h - 12} textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function BarsH({ data, fmt = (v: number) => String(v) }: { data: { label: string; value: number; color?: string }[]; fmt?: (v: number) => string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const rh = 30, W = 560, H = data.length * rh + 8;
  return (
    <svg className="viz" viewBox={`0 0 ${W} ${H}`} role="img">
      {data.map((d, i) => {
        const y = 4 + i * rh;
        const bw = Math.max(3, (d.value / max) * (W - 240));
        return (
          <g key={d.label}>
            <text x={150} y={y + 19} textAnchor="end">{d.label}</text>
            <rect x={160} y={y + 7} width={bw} height={15} rx={4} fill={d.color ?? 'var(--seq-4)'} />
            <text className="dl" x={168 + bw} y={y + 19}>{fmt(d.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}
