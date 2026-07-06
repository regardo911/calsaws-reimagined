'use client';
// Staff-keyed application registration (SAWS 1 / walk-in).
import { useState } from 'react';
import Link from 'next/link';
import { submitApplicationAction } from '@/app/actions/case-actions';
import type { Program } from '@/lib/engine';

const PROGRAMS: Program[] = ['CF', 'CW', 'MC', 'GA', 'CAPI', 'RCA'];
const NAMES: Record<Program, string> = { CF: 'CalFresh', CW: 'CalWORKs', MC: 'Medi-Cal', GA: 'General Relief', CAPI: 'CAPI', RCA: 'Refugee Cash' };
const COUNTIES = ['Los Angeles', 'San Diego', 'Alameda', 'Fresno', 'Sacramento'];

export default function RegisterPage() {
  const [mode, setMode] = useState('Regular Intake');
  const [name, setName] = useState('');
  const [age, setAge] = useState(35);
  const [kids, setKids] = useState(0);
  const [income, setIncome] = useState(0);
  const [rent, setRent] = useState(0);
  const [county, setCounty] = useState('Los Angeles');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ caseNumber: string; expedited: boolean } | null>(null);
  const [error, setError] = useState('');

  async function submit() {
    if (!programs.length) { setError('Select at least one program'); return; }
    setBusy(true); setError('');
    const persons = [{ name: name || 'Unnamed Applicant', age, employed: income > 0 }];
    for (let i = 0; i < kids; i++) persons.push({ name: `Child ${i + 1}`, age: 5 + i, employed: false });
    const res = await submitApplicationAction({
      persons, monthlyIncome: income, resources: 0, rent, utilities: 0, homeless: false,
      programs, county, source: 'County office (SAWS 1)', intakeMode: mode,
    });
    setBusy(false);
    if ('error' in res) { setError(res.error); return; }
    setDone(res);
  }

  if (done) {
    return (
      <div>
        <div className="card" style={{ maxWidth: 640, margin: '40px auto' }}><div className="bd" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40 }}>📥</div>
          <h2 style={{ margin: '10px 0' }}>Application registered</h2>
          <p className="muted">Case <strong className="mono">{done.caseNumber}</strong> created and a {done.expedited ? 'Critical expedited ' : ''}task routed to the intake queue.</p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 20, gap: 12 }}>
            <Link className="btn" href="/worker">Back to queue</Link>
            <button className="btn ghost" onClick={() => { setDone(null); setName(''); setPrograms([]); }}>Register another</button>
          </div>
        </div></div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/worker" className="small">← Work queue</Link>
      <h1 style={{ fontSize: 23, margin: '10px 0 4px' }}>Application registration</h1>
      <p className="muted small" style={{ margin: '0 0 18px' }}>Paper SAWS 1 keyed by staff. e-Applications from the portal arrive in the queue automatically.</p>
      {error && <p className="err">{error}</p>}
      <div className="card" style={{ maxWidth: 700 }}><div className="bd stack" style={{ gap: 14 }}>
        <div className="choices">
          {['Regular Intake', 'Add-a-Program'].map(m => (
            <button key={m} className="choice" aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>
        <div className="grid g2">
          <div><label className="f">Primary applicant</label><input className="in" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
          <div><label className="f">Age</label><input className="in num" type="number" min={18} value={age} onChange={e => setAge(+e.target.value || 18)} /></div>
          <div><label className="f">Children under 18</label><input className="in num" type="number" min={0} value={kids} onChange={e => setKids(+e.target.value || 0)} /></div>
          <div><label className="f">Monthly income ($)</label><input className="in num" type="number" min={0} value={income} onChange={e => setIncome(+e.target.value || 0)} /></div>
          <div><label className="f">Monthly rent ($)</label><input className="in num" type="number" min={0} value={rent} onChange={e => setRent(+e.target.value || 0)} /></div>
          <div><label className="f">County</label><select className="in" value={county} onChange={e => setCounty(e.target.value)}>{COUNTIES.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div><span className="f">Programs requested</span>
          <div className="choices">
            {PROGRAMS.map(p => (
              <button key={p} className="choice" aria-pressed={programs.includes(p)}
                onClick={() => setPrograms(cur => cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p])}>{NAMES[p]}</button>
            ))}
          </div>
        </div>
        <div><button className="btn big" onClick={submit} disabled={busy}>{busy ? 'Registering…' : 'Register & route task'}</button></div>
      </div></div>
    </div>
  );
}
