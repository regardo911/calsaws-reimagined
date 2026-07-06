'use client';
// EDBC runner — calls the server action (engine runs server-side against DB
// state + live rule_params), renders results with full traces, Accept & Save.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { runEdbcAction, acceptEdbcAction } from '@/app/actions/case-actions';
import { Trace } from '@/components/ui';
import type { EdbcOutput, Program } from '@/lib/engine';

const NAMES: Record<Program, string> = { CF: 'CalFresh', CW: 'CalWORKs', MC: 'Medi-Cal', GA: 'General Relief', CAPI: 'CAPI', RCA: 'Refugee Cash' };
const VARS: Record<Program, string> = { CF: '--s-cf', CW: '--s-cw', MC: '--s-mc', GA: '--s-ga', CAPI: '--s-capi', RCA: '--s-rca' };

export default function EdbcPanel({ caseId, programs, blockedByBanner }: {
  caseId: string; programs: Program[]; blockedByBanner: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Program[]>(programs);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [out, setOut] = useState<{ runId: string; output: EdbcOutput } | null>(null);
  const [openTrace, setOpenTrace] = useState<number | null>(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function run() {
    setBusy(true); setMsg('');
    try {
      const res = await runEdbcAction(caseId, selected, month);
      setOut(res); setOpenTrace(0);
    } catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  }
  async function accept() {
    if (!out) return;
    setBusy(true); setMsg('');
    try {
      const { status } = await acceptEdbcAction(caseId, out.runId);
      setMsg(status === 'pending_authorization'
        ? 'Saved — routed to supervisor for authorization'
        : 'EDBC accepted — NOA generated' + (status === 'approved' ? ' and benefits issued' : ''));
      setOut(null);
      router.push(`/case/${caseId}?tab=notices`);
      router.refresh();
    } catch (e) { setMsg((e as Error).message); setBusy(false); }
  }

  return (
    <>
      <div className="card"><div className="bd">
        <div className="row wrap" style={{ gap: 16 }}>
          <div><span className="f">Programs</span>
            <div className="choices">
              {programs.map(p => (
                <button key={p} className="choice" aria-pressed={selected.includes(p)} data-testid={`edbc-prog-${p}`}
                  onClick={() => setSelected(cur => cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p])}>{NAMES[p]}</button>
              ))}
            </div></div>
          <div><label className="f" htmlFor="bmonth">Benefit month</label>
            <input id="bmonth" className="in" type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 170 }} /></div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button className="btn big" onClick={run} disabled={busy || selected.length === 0} data-testid="run-edbc">
              {busy ? 'Running…' : '▶ Run EDBC'}
            </button></div>
        </div>
        <p className="xs muted" style={{ marginTop: 10 }}>Real-time rules engine, server-side against the live database — no overnight batch. Every result carries its full calculation trace.</p>
      </div></div>

      {msg && <div className="banner info" style={{ marginTop: 14 }} data-testid="edbc-msg">{msg}</div>}

      {out?.output.blocked && (
        <div className="banner yellow" style={{ marginTop: 16 }} data-testid="edbc-blocked">
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div><strong>EDBC blocked — Full Case Review is required before EDBC is run and authorized.</strong>{' '}
            {out.output.yellowBanner?.map(y => y.text).join(' ')} Resolve it from the Data Matches tab.</div>
        </div>
      )}

      {out && !out.output.blocked && (
        <div className="stack" style={{ marginTop: 18 }} data-testid="edbc-results">
          {out.output.results.map((r, i) => (
            <div className="card" key={r.program}>
              <div className="hd">
                <span className="pill"><span className="dot" style={{ background: `var(${VARS[r.program]})` }} />{NAMES[r.program]}</span>
                {r.status === 'Eligible' ? <span className="pill ok" data-testid={`result-${r.program}`}>Eligible</span> : <span className="pill crit" data-testid={`result-${r.program}`}>Ineligible</span>}
                {r.amount > 0 && <strong className="num" style={{ fontSize: 18 }} data-testid={`amount-${r.program}`}>${r.amount.toLocaleString()}/mo</strong>}
                {r.expedited && <span className="pill crit">⚡ Expedited</span>}
                {r.aidCode && r.status === 'Eligible' && <span className="pill">Aid code {r.aidCode}</span>}
                <span style={{ flex: 1 }} />
                <button className="btn ghost sm" onClick={() => setOpenTrace(openTrace === i ? null : i)} data-testid={`trace-toggle-${r.program}`}>How we got here</button>
              </div>
              <div className="bd">
                {r.reasons.map((x, j) => <p key={j} className="small">• {x.text}</p>)}
                {openTrace === i && <div style={{ marginTop: 12 }}><Trace trace={r.trace} /></div>}
              </div>
            </div>
          ))}
          <div className="card"><div className="bd row wrap" style={{ justifyContent: 'space-between' }}>
            <div className="small muted">
              Accepting saves the determination, generates plain-language NOAs
              {out.output.results.some(r => r.status === 'Eligible' && r.amount > 0) ? ', and issues benefits to EBT' : ''}.
              {out.output.results.some(r => r.program === 'CW' && r.status === 'Eligible') && <strong> CalWORKs grants route to a supervisor for authorization.</strong>}
            </div>
            <button className="btn big gold" onClick={accept} disabled={busy} data-testid="accept-edbc">Accept & Save EDBC</button>
          </div></div>
        </div>
      )}

      {blockedByBanner && !out && (
        <div className="banner yellow small" style={{ marginTop: 14 }}>
          ⚠️ This case has an unresolved data-match discrepancy — EDBC will be blocked until it is resolved.
        </div>
      )}
    </>
  );
}
