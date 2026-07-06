'use client';
// Guided application — client wizard, guest-friendly until submission.
// Unauthenticated submit stashes the draft, routes through signup, and
// resumes automatically.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { submitApplicationAction, type ApplicationPayload } from '@/app/actions/case-actions';
import type { Program } from '@/lib/engine';

const PROGRAMS: { key: Program; name: string; desc: string; cssVar: string; needsKids?: boolean; adultOnly?: boolean }[] = [
  { key: 'CF', name: 'CalFresh', desc: 'Monthly money for groceries on an EBT card.', cssVar: '--s-cf' },
  { key: 'MC', name: 'Medi-Cal', desc: 'Free or low-cost health coverage.', cssVar: '--s-mc' },
  { key: 'CW', name: 'CalWORKs', desc: 'Cash aid and job services for families with children.', cssVar: '--s-cw', needsKids: true },
  { key: 'GA', name: 'General Relief', desc: 'County cash aid for adults.', cssVar: '--s-ga', adultOnly: true },
];
const COUNTIES = ['Los Angeles', 'San Diego', 'Alameda', 'Fresno', 'Sacramento', 'Riverside', 'Kern', 'Orange', 'Santa Clara', 'Humboldt'];
const DRAFT_KEY = 'calsaws-apply-draft';

interface Draft {
  step: number; people: { name: string; age: string }[];
  income: number; resources: number; rent: number; utilities: number;
  homeless: boolean; programs: Program[]; county: string;
}
const blank: Draft = { step: 0, people: [{ name: '', age: '' }], income: 0, resources: 0, rent: 0, utilities: 0, homeless: false, programs: [], county: 'Los Angeles' };

export default function ApplyPage() {
  const router = useRouter();
  const [d, setD] = useState<Draft>(blank);
  const [done, setDone] = useState<{ caseNumber: string; expedited: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) { try { setD(JSON.parse(raw)); setResuming(true); } catch { /* ignore */ } }
  }, []);
  const save = (next: Draft) => { setD(next); sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next)); };

  async function submit() {
    setBusy(true); setError('');
    const payload: ApplicationPayload = {
      persons: d.people.filter(p => p.name).map(p => ({ name: p.name, age: +p.age || 0, employed: d.income > 0 })),
      monthlyIncome: d.income, resources: d.resources, rent: d.rent, utilities: d.utilities,
      homeless: d.homeless, programs: d.programs, county: d.county,
    };
    const res = await submitApplicationAction(payload);
    setBusy(false);
    if ('error' in res) {
      if (res.error === 'auth') {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
        router.push('/signup?next=/portal/apply');
        return;
      }
      setError(res.error);
      return;
    }
    sessionStorage.removeItem(DRAFT_KEY);
    setDone(res);
  }

  if (done) {
    return (
      <Wrap>
        <div className="card" style={{ maxWidth: 680, margin: '30px auto' }}><div className="bd" style={{ textAlign: 'center', padding: '44px 30px' }}>
          <div style={{ fontSize: 44 }}>✅</div>
          <h1 style={{ fontSize: 26, margin: '12px 0' }}>Application received!</h1>
          <p className="muted">Your application was submitted to your county. A worker will review it and you will get a notice with the decision.</p>
          <div style={{ margin: '22px 0' }}>
            <div className="eyebrow">Your case number</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 750 }} data-testid="case-number">{done.caseNumber}</div>
          </div>
          {done.expedited && <div className="banner good" style={{ textAlign: 'left' }} data-testid="expedited-callout">⚡ You may qualify for EXPEDITED CalFresh — food benefits within 3 days. Your county will contact you within 1 business day.</div>}
          <div className="row" style={{ justifyContent: 'center', marginTop: 22, gap: 12 }}>
            <Link className="btn" href="/portal">My benefits</Link>
          </div>
        </div></div>
      </Wrap>
    );
  }

  const steps = ['Your household', 'Income', 'Housing costs', 'Programs', 'Review & submit'];
  const kids = d.people.some((p, i) => i > 0 && +p.age < 18);
  const canNext = d.step === 0 ? (d.people[0].name && d.people[0].age !== '') : d.step === 3 ? d.programs.length > 0 : true;

  return (
    <Wrap>
      <main className="portal-body" id="main" style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/portal" className="small">← BenefitsCal</Link>
        <h1 style={{ fontSize: 26, margin: '10px 0 16px' }}>Apply for benefits</h1>
        {resuming && <div className="banner info small" style={{ marginBottom: 14 }}>Welcome back — your application draft was saved.</div>}
        {error && <p className="err" role="alert">{error}</p>}
        <div className="steps">
          {steps.map((s, i) => <span key={s} className={`st ${i === d.step ? 'on' : i < d.step ? 'done' : ''}`}>{i < d.step ? '✓' : i + 1} {s}</span>)}
        </div>
        <div className="card"><div className="bd">
          {d.step === 0 && (<>
            <p className="muted small">Who lives with you? Include yourself first.</p>
            {d.people.map((p, i) => (
              <div className="row wrap" style={{ marginTop: 10 }} key={i}>
                <input className="in" style={{ flex: 2, minWidth: 170 }} placeholder={i === 0 ? 'Your full name' : 'Name'}
                  value={p.name} data-testid={`person-name-${i}`}
                  onChange={e => { const people = [...d.people]; people[i] = { ...people[i], name: e.target.value }; save({ ...d, people }); }} />
                <input className="in num" type="number" style={{ width: 90 }} placeholder="Age" aria-label="Age"
                  value={p.age} data-testid={`person-age-${i}`}
                  onChange={e => { const people = [...d.people]; people[i] = { ...people[i], age: e.target.value }; save({ ...d, people }); }} />
                {i > 0 && <button className="btn ghost sm" onClick={() => save({ ...d, people: d.people.filter((_, j) => j !== i) })}>Remove</button>}
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <button className="btn ghost sm" data-testid="add-person" onClick={() => save({ ...d, people: [...d.people, { name: '', age: '' }] })}>+ Add a person</button>
            </div>
          </>)}
          {d.step === 1 && (<>
            <div><label className="f" htmlFor="inc">Total money your household earns or receives each month, before taxes</label>
              <input id="inc" className="in num" type="number" min={0} value={d.income} data-testid="income"
                onChange={e => save({ ...d, income: +e.target.value || 0 })} style={{ maxWidth: 200 }} /></div>
            <div style={{ marginTop: 14 }}><label className="f" htmlFor="res">Cash and bank accounts right now</label>
              <input id="res" className="in num" type="number" min={0} value={d.resources} data-testid="resources"
                onChange={e => save({ ...d, resources: +e.target.value || 0 })} style={{ maxWidth: 200 }} /></div>
          </>)}
          {d.step === 2 && (<>
            <div className="choices" style={{ marginBottom: 14 }}>
              <button className="choice" aria-pressed={!d.homeless} onClick={() => save({ ...d, homeless: false })}>I pay for housing</button>
              <button className="choice" aria-pressed={d.homeless} data-testid="homeless" onClick={() => save({ ...d, homeless: true })}>I don’t have stable housing</button>
            </div>
            {d.homeless ? <p className="small muted">That’s okay — you can still get benefits, often faster.</p> : (<>
              <div><label className="f" htmlFor="rent">Monthly rent or mortgage</label>
                <input id="rent" className="in num" type="number" min={0} value={d.rent} data-testid="rent"
                  onChange={e => save({ ...d, rent: +e.target.value || 0 })} style={{ maxWidth: 200 }} /></div>
              <div style={{ marginTop: 14 }}><label className="f" htmlFor="util">Monthly utilities (power, gas, water, phone)</label>
                <input id="util" className="in num" type="number" min={0} value={d.utilities}
                  onChange={e => save({ ...d, utilities: +e.target.value || 0 })} style={{ maxWidth: 200 }} /></div>
            </>)}
          </>)}
          {d.step === 3 && (<>
            <p className="muted small" style={{ marginBottom: 12 }}>Pick everything you want — one application covers them all.</p>
            <div className="stack">
              {PROGRAMS.filter(p => (!p.needsKids || kids) && (!p.adultOnly || (!kids && d.people.length === 1))).map(p => (
                <button key={p.key} className="choice" data-testid={`prog-${p.key}`}
                  style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left' }}
                  aria-pressed={d.programs.includes(p.key)}
                  onClick={() => save({ ...d, programs: d.programs.includes(p.key) ? d.programs.filter(x => x !== p.key) : [...d.programs, p.key] })}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: `var(${p.cssVar})`, flex: 'none' }} />
                  <span><strong>{p.name}</strong><br /><span className="small muted">{p.desc}</span></span>
                </button>
              ))}
            </div>
          </>)}
          {d.step === 4 && (
            <div className="stack small">
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Household</span><strong>{d.people.filter(p => p.name).map(p => p.name).join(', ') || '—'}</strong></div>
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Monthly income</span><strong className="num">${d.income.toLocaleString()}</strong></div>
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Housing</span><strong className="num">{d.homeless ? 'No stable housing' : `$${(d.rent + d.utilities).toLocaleString()}/mo`}</strong></div>
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Programs</span><span>{d.programs.join(', ') || '—'}</span></div>
              <div><label className="f" htmlFor="county">County</label>
                <select id="county" className="in" style={{ maxWidth: 240 }} value={d.county} onChange={e => save({ ...d, county: e.target.value })}>
                  {COUNTIES.map(c => <option key={c}>{c}</option>)}
                </select></div>
              <p className="xs muted">Submitting requires an account so you can track your case — you’ll be asked to create one if you’re not signed in.</p>
            </div>
          )}
        </div></div>
        <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
          <button className="btn ghost" disabled={d.step === 0} onClick={() => save({ ...d, step: d.step - 1 })}>Back</button>
          {d.step < 4
            ? <button className="btn" disabled={!canNext} data-testid="next" onClick={() => save({ ...d, step: d.step + 1 })}>Next</button>
            : <button className="btn gold big" disabled={busy} data-testid="submit-application" onClick={submit}>{busy ? 'Submitting…' : 'Submit application'}</button>}
        </div>
      </main>
    </Wrap>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/portal"><span className="seal">CA</span> BenefitsCal <span style={{ fontWeight: 400, opacity: .75 }}>· Reimagined</span></Link>
        <span className="spacer" />
        <Link href="/portal" style={{ color: '#fff', fontSize: 13 }}>My benefits</Link>
      </header>
      {children}
    </>
  );
}
