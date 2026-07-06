// Case home — tabs over the full case graph. Server component; EDBC and
// Yellow Banner interactions are client islands.
import Link from 'next/link';
import { getStaffContext } from '@/lib/auth-helpers';
import { loadParams } from '@/lib/rules';
import { slaInfo, fdate, money, PROG, type DbCase } from '@/lib/domain';
import { ProgPill, StatusPill, SlaChip, Trace } from '@/components/ui';
import EdbcPanel from './EdbcPanel';
import ResolveBanner from './ResolveBanner';
import type { Program } from '@/lib/engine';

export const dynamic = 'force-dynamic';

const TABS = [
  ['summary', 'Summary'], ['household', 'Household'], ['income', 'Income & Resources'],
  ['expenses', 'Expenses'], ['matches', 'Data Matches'], ['edbc', 'EDBC'],
  ['notices', 'Notices'], ['journal', 'Journal'], ['issuances', 'Issuances'],
] as const;

export default async function CasePage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'summary' } = await searchParams;
  const { supabase } = await getStaffContext();
  const P = await loadParams();

  const [{ data: c }, { data: persons }, { data: income }, { data: resources }, { data: expenses },
    { data: matches }, { data: runs }, { data: notices }, { data: journal }, { data: issuances }] = await Promise.all([
    supabase.from('cases').select('*, profiles:assigned_to(full_name)').eq('id', id).single(),
    supabase.from('persons').select('*').eq('case_id', id).order('person_key'),
    supabase.from('income_records').select('*').eq('case_id', id),
    supabase.from('resource_records').select('*').eq('case_id', id),
    supabase.from('expense_records').select('*').eq('case_id', id),
    supabase.from('data_matches').select('*').eq('case_id', id),
    supabase.from('edbc_runs').select('*, edbc_results(*)').eq('case_id', id).order('created_at', { ascending: false }),
    supabase.from('notices').select('*').eq('case_id', id).order('date', { ascending: false }),
    supabase.from('journal_entries').select('*').eq('case_id', id).order('created_at', { ascending: false }),
    supabase.from('issuances').select('*').eq('case_id', id).order('date', { ascending: false }),
  ]);

  if (!c) return <p className="err">Case not found.</p>;
  const cse = c as DbCase & { profiles: { full_name: string } | null };
  const prim = (persons ?? []).find(p => p.role === 'primary') ?? (persons ?? [])[0];
  const sla = slaInfo(cse, P);
  const unresolved = (matches ?? []).filter(m => !m.resolved && Math.abs(Number(m.matched) - Number(m.reported)) >= P.yellowBannerThreshold);
  const lastRun = (runs ?? []).find(r => !r.blocked && (r.edbc_results ?? []).length);
  const gross = (income ?? []).reduce((s, i) => s + Number(i.amount), 0);
  const shelter = (expenses ?? []).filter(e => ['rent', 'mortgage', 'utilities'].includes(e.kind)).reduce((s, e) => s + Number(e.amount), 0);
  const terminal = ['approved', 'denied'].includes(cse.status);

  return (
    <>
      <Link href="/worker" className="small">← Work queue</Link>
      <div className="row wrap" style={{ margin: '10px 0 4px', gap: 12 }}>
        <h1 style={{ fontSize: 23 }} data-testid="case-name">{prim?.name ?? 'Case'}</h1>
        <span className="mono muted">{cse.case_number}</span>
        <StatusPill s={cse.status} />
        {cse.expedited && <span className="pill crit">⚡ Expedited 3-day</span>}
        <SlaChip left={sla.left} overdue={sla.overdue} atRisk={sla.atRisk} terminal={terminal} />
      </div>
      <div className="row wrap small muted" style={{ marginBottom: 8 }}>
        <span>{cse.county} County</span><span>·</span><span>Applied {fdate(cse.application_date)}</span><span>·</span>
        <span>{cse.source} — {cse.intake_mode}</span><span>·</span><span>EW: {cse.profiles?.full_name ?? '—'}</span>
      </div>
      <div className="row wrap" style={{ marginBottom: 14 }}>{(cse.programs as Program[]).map(p => <ProgPill key={p} p={p} />)}</div>

      {unresolved.length > 0 && (
        <div className="banner yellow" role="alert" data-testid="yellow-banner">
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <strong>Full Case Review is required before EDBC is run and authorized.</strong>{' '}
            Programs Affected: {(cse.programs as Program[]).map(p => PROG[p].name).join(', ')}.{' '}
            <span className="small">{unresolved[0].source} reports <strong>{money(Number(unresolved[0].matched))}/mo</strong> {unresolved[0].field}; the case records <strong>{money(Number(unresolved[0].reported))}/mo</strong>.</span>
            <div style={{ marginTop: 10 }}>
              <ResolveBanner caseId={cse.id} matchId={unresolved[0].id}
                reported={Number(unresolved[0].reported)} matched={Number(unresolved[0].matched)} />
            </div>
          </div>
        </div>
      )}
      {cse.golden_tag && <div className="banner info small" style={{ marginTop: 10 }}>🎯 Golden test case {cse.golden_tag}. {cse.expected_note}</div>}

      <div className="tabs" role="tablist" style={{ margin: '16px 0' }}>
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/case/${cse.id}?tab=${k}`} role="tab" aria-selected={tab === k} data-testid={`tab-${k}`}
            style={{
              textDecoration: 'none', padding: '10px 15px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
              color: tab === k ? 'var(--primary)' : 'var(--ink-2)',
              borderBottom: tab === k ? '3px solid var(--primary)' : '3px solid transparent', marginBottom: -2,
            }}>
            {l}{k === 'matches' && unresolved.length > 0 ? ' ⚠' : ''}
          </Link>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="grid g2">
          <div className="card"><div className="hd"><h3 style={{ fontSize: 15 }}>Case at a glance</h3></div>
            <div className="bd stack small">
              <Row l="Household size" v={String((persons ?? []).length)} />
              <Row l="Monthly gross income" v={money(gross)} />
              <Row l="Shelter costs" v={money(shelter)} />
              <Row l="Address" v={cse.address ?? '—'} />
              <Row l="Phone" v={cse.phone ?? '—'} />
            </div></div>
          <div className="card"><div className="hd"><h3 style={{ fontSize: 15 }}>Latest determination</h3></div>
            <div className="bd">
              {lastRun ? (<>
                {(lastRun.edbc_results as { program: Program; status: string; amount: number }[]).map((r, i) => (
                  <div key={i} className="row" style={{ justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                    <ProgPill p={r.program} />
                    {r.status === 'Eligible'
                      ? <span className="pill ok">Eligible{Number(r.amount) > 0 ? ` · ${money(Number(r.amount))}/mo` : ''}</span>
                      : <span className="pill crit">Ineligible</span>}
                  </div>
                ))}
                <p className="xs muted" style={{ marginTop: 10 }}>Run {fdate(lastRun.created_at?.slice(0, 10))} · benefit month {lastRun.benefit_month}</p>
              </>) : (<>
                <p className="muted small">No EDBC on file yet.</p>
                <div style={{ marginTop: 12 }}><Link className="btn" href={`/case/${cse.id}?tab=edbc`}>Run EDBC →</Link></div>
              </>)}
            </div></div>
        </div>
      )}

      {tab === 'household' && (
        <div className="card"><div className="tblwrap"><table className="tbl">
          <thead><tr><th>Name</th><th>Age</th><th>Role</th><th>SSN</th><th>Citizen</th><th>Flags</th></tr></thead>
          <tbody>{(persons ?? []).map(p => (
            <tr key={p.id}><td><strong>{p.name}</strong></td><td className="num">{p.age}</td><td>{p.role}</td>
              <td className="mono small">{p.ssn ?? '—'}</td><td>{p.citizen ? 'Yes' : (p.immigration_status ?? 'No')}</td>
              <td className="small">{[p.aged && 'Aged', p.disabled && 'Disabled', p.blind && 'Blind', p.pregnant && 'Pregnant', p.refugee && 'Refugee', p.employed && 'Employed'].filter(Boolean).join(', ') || '—'}</td></tr>
          ))}</tbody>
        </table></div></div>
      )}

      {tab === 'income' && (
        <div className="grid g2">
          <div className="card"><div className="hd"><h3 style={{ fontSize: 15 }}>Income</h3></div>
            <div className="tblwrap"><table className="tbl">
              <thead><tr><th>Type</th><th>Source</th><th className="r">Monthly</th></tr></thead>
              <tbody>
                {(income ?? []).map(i => <tr key={i.id}><td>{i.kind}</td><td>{i.subtype}</td><td className="r num"><strong>{money(Number(i.amount))}</strong></td></tr>)}
                {(income ?? []).length === 0 && <tr><td colSpan={3} className="muted">No income reported</td></tr>}
                <tr><td colSpan={2}><strong>Total gross</strong></td><td className="r num"><strong>{money(gross)}</strong></td></tr>
              </tbody>
            </table></div></div>
          <div className="card"><div className="hd"><h3 style={{ fontSize: 15 }}>Resources</h3></div>
            <div className="tblwrap"><table className="tbl">
              <thead><tr><th>Type</th><th className="r">Value</th></tr></thead>
              <tbody>
                {(resources ?? []).map(r => <tr key={r.id}><td>{r.label ?? r.kind}</td><td className="r num">{money(Number(r.value))}</td></tr>)}
                {(resources ?? []).length === 0 && <tr><td colSpan={2} className="muted">None</td></tr>}
              </tbody>
            </table></div></div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="card" style={{ maxWidth: 520 }}><div className="tblwrap"><table className="tbl">
          <thead><tr><th>Expense</th><th className="r">Monthly</th></tr></thead>
          <tbody>
            {(expenses ?? []).filter(e => Number(e.amount) > 0).map(e => <tr key={e.id}><td>{e.kind.replace('_', ' ')}</td><td className="r num">{money(Number(e.amount))}</td></tr>)}
            {cse.flags?.homeless && <tr><td colSpan={2}>🏕️ Household is experiencing homelessness</td></tr>}
          </tbody>
        </table></div></div>
      )}

      {tab === 'matches' && (
        <div className="card"><div className="hd"><h3 style={{ fontSize: 15 }}>External data matches</h3><span className="xs muted">IEVS · MEDS · SSA · SAVE (simulated interfaces)</span></div>
          <div className="tblwrap"><table className="tbl">
            <thead><tr><th>Source</th><th>Field</th><th className="r">Case records</th><th className="r">Match reports</th><th>Status</th></tr></thead>
            <tbody>{(matches ?? []).map(m => {
              const disc = !m.resolved && Math.abs(Number(m.matched) - Number(m.reported)) >= P.yellowBannerThreshold;
              return (<tr key={m.id}>
                <td>{m.source}</td><td>{m.field}</td>
                <td className="r num">{m.field === 'earned income' ? money(Number(m.reported)) : '✓'}</td>
                <td className="r num">{m.field === 'earned income' ? money(Number(m.matched)) : '✓'}</td>
                <td>{m.resolved ? <span className="pill ok">Verified</span>
                  : disc ? <span className="row" style={{ gap: 8 }}><span className="pill warn">⚠ Discrepancy</span><ResolveBanner caseId={cse.id} matchId={m.id} reported={Number(m.reported)} matched={Number(m.matched)} small /></span>
                    : <span className="pill">Pending</span>}</td>
              </tr>);
            })}</tbody>
          </table></div></div>
      )}

      {tab === 'edbc' && (
        <EdbcPanel caseId={cse.id} programs={cse.programs as Program[]} blockedByBanner={unresolved.length > 0} />
      )}

      {tab === 'notices' && (
        (notices ?? []).length ? (
          <div className="stack">
            {(notices ?? []).map(n => {
              const reasons: string[] = Array.isArray(n.reasons) ? n.reasons.map((r: unknown) => typeof r === 'string' ? r : (r as { text: string }).text) : [];
              const approve = n.type === 'Approval NOA';
              return (
                <div className="noa" key={n.id} data-testid="staff-noa">
                  <div className="nhead">
                    <div><div className="eyebrow">{cse.county} County · CalSAWS Reimagined</div>
                      <h2 style={{ marginTop: 6 }}>{n.type} — {PROG[n.program as Program]?.name}</h2></div>
                    <div style={{ textAlign: 'right' }} className="small"><div className="mono">{cse.case_number}</div><div className="muted num">{fdate(n.date)}</div></div>
                  </div>
                  <p className="small muted">To: <strong>{prim?.name}</strong>{cse.address ? ` · ${cse.address}` : ''}</p>
                  <div style={{ margin: '18px 0' }}>
                    {approve
                      ? <div className="amount-line" style={{ color: 'var(--ok)' }}>{Number(n.amount) > 0 ? `${money(Number(n.amount))} per month` : 'Approved'}</div>
                      : <div className="amount-line" style={{ color: 'var(--crit)' }}>Not approved</div>}
                  </div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Why</div>
                  {reasons.map((r, i) => <p key={i} className="small" style={{ marginBottom: 6 }}>• {r}</p>)}
                </div>
              );
            })}
          </div>
        ) : <div className="card"><div className="bd muted">No notices yet — notices generate when EDBC results are accepted.</div></div>
      )}

      {tab === 'journal' && (
        <div className="card"><div className="bd stack" style={{ gap: 0 }}>
          {(journal ?? []).map(j => (
            <div key={j.id} style={{ padding: '12px 4px', borderBottom: '1px solid var(--line)' }}>
              <div className="row small" style={{ justifyContent: 'space-between' }}><strong>{j.kind}</strong><span className="muted num">{fdate(j.date)} · {j.author_name}</span></div>
              <p className="small" style={{ marginTop: 4 }}>{j.text}</p>
            </div>
          ))}
          {(journal ?? []).length === 0 && <p className="muted">Empty journal.</p>}
        </div></div>
      )}

      {tab === 'issuances' && (
        <div className="card" style={{ maxWidth: 620 }}><div className="tblwrap"><table className="tbl">
          <thead><tr><th>Date</th><th>Program</th><th>Method</th><th className="r">Amount</th></tr></thead>
          <tbody>
            {(issuances ?? []).map(i => <tr key={i.id}><td className="num small">{fdate(i.date)}</td><td><ProgPill p={i.program as Program} /></td><td>{i.method}</td><td className="r num"><strong>{money(Number(i.amount))}</strong></td></tr>)}
            {(issuances ?? []).length === 0 && <tr><td colSpan={4} className="muted">No issuances.</td></tr>}
          </tbody>
        </table></div></div>
      )}
    </>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">{l}</span><strong className="num" style={{ textAlign: 'right' }}>{v}</strong></div>;
}
