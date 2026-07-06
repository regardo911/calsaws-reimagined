'use client';
// Instant prescreener — no account needed; limits come from live rule_params.
import { useState } from 'react';
import Link from 'next/link';
import { prescreenAction } from '@/app/actions/case-actions';
import type { Program } from '@/lib/engine';

const NAMES: Record<string, string> = { CF: 'CalFresh', CW: 'CalWORKs', MC: 'Medi-Cal', GA: 'General Relief' };

export default function Prescreen() {
  const [size, setSize] = useState(1);
  const [income, setIncome] = useState(0);
  const [kids, setKids] = useState(false);
  const [aged, setAged] = useState(false);
  const [resources, setResources] = useState(0);
  const [result, setResult] = useState<{ programs: Program[]; notes: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    setResult(await prescreenAction({ size, income, kids, aged, resources }));
    setBusy(false);
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/portal"><span className="seal">CA</span> BenefitsCal <span style={{ fontWeight: 400, opacity: .75 }}>· Reimagined</span></Link>
        <span className="spacer" />
        <Link href="/login" style={{ color: '#fff', fontSize: 13 }}>Sign in</Link>
      </header>
      <main className="portal-body" id="main" style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/portal/apply" className="small">← Apply</Link>
        <h1 style={{ fontSize: 26, margin: '10px 0 20px' }}>Quick eligibility check</h1>
        <div className="card"><div className="bd stack" style={{ gap: 16 }}>
          <div><label className="f" htmlFor="ps1">How many people live in your household?</label>
            <input id="ps1" className="in num" type="number" min={1} max={12} value={size} onChange={e => setSize(+e.target.value || 1)} style={{ maxWidth: 130 }} /></div>
          <div><label className="f" htmlFor="ps2">Total monthly income before taxes</label>
            <input id="ps2" className="in num" type="number" min={0} value={income} onChange={e => setIncome(+e.target.value || 0)} style={{ maxWidth: 180 }} data-testid="ps-income" /></div>
          <div><span className="f">Is anyone in your household under 18?</span>
            <div className="choices">
              <button className="choice" aria-pressed={kids} onClick={() => setKids(true)} data-testid="ps-kids-yes">Yes</button>
              <button className="choice" aria-pressed={!kids} onClick={() => setKids(false)}>No</button>
            </div></div>
          <div><span className="f">Is anyone 60 or older, or living with a disability?</span>
            <div className="choices">
              <button className="choice" aria-pressed={aged} onClick={() => setAged(true)}>Yes</button>
              <button className="choice" aria-pressed={!aged} onClick={() => setAged(false)}>No</button>
            </div></div>
          <div><label className="f" htmlFor="ps5">Cash and bank accounts right now</label>
            <input id="ps5" className="in num" type="number" min={0} value={resources} onChange={e => setResources(+e.target.value || 0)} style={{ maxWidth: 180 }} /></div>
          <div><button className="btn big" onClick={go} disabled={busy} data-testid="ps-go">{busy ? 'Checking…' : 'See what I may qualify for'}</button></div>
        </div></div>
        {result && (
          <div className="card" style={{ marginTop: 22 }} data-testid="ps-result"><div className="bd">
            <h3>Based on your answers, you may qualify for:</h3>
            <div className="row wrap" style={{ margin: '14px 0' }}>
              {result.programs.length
                ? result.programs.map(p => <span key={p} className="pill info">{NAMES[p] ?? p}</span>)
                : <p className="muted">Your income may be above the limits — but limits change with your situation. It never hurts to apply.</p>}
            </div>
            {result.notes.map(n => <p key={n} className="small muted">• {n}</p>)}
            <div className="row" style={{ marginTop: 16 }}><Link className="btn gold" href="/portal/apply">Start my application</Link></div>
            <p className="xs muted" style={{ marginTop: 12 }}>This is an estimate, not a decision. A county worker makes the final determination.</p>
          </div></div>
        )}
      </main>
    </>
  );
}
