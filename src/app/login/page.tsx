'use client';
// Sign-in — real Supabase auth. Demo buttons only prefill the form;
// the normal credential flow always runs. For the applicant entry point
// (?as=applicant) the prominent action is "Start an application"; signing
// in to an existing account is the secondary option below it.
import { useActionState, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/app/actions/auth';

const DEMO: Record<string, { email: string; label: string }> = {
  applicant: { email: 'applicant.maria@demo.calsaws.test', label: 'Applicant — Maria Reyes' },
  worker: { email: 'worker.dana@demo.calsaws.test', label: 'Eligibility Worker — Dana Whitfield' },
  supervisor: { email: 'supervisor.angela@demo.calsaws.test', label: 'Supervisor — Angela Ruiz' },
  admin: { email: 'admin.chris@demo.calsaws.test', label: 'Administrator — Chris Yamamoto' },
};
const DEMO_PASSWORD = 'CalSAWS-demo-2026!';

function LoginForm() {
  const params = useSearchParams();
  const preset = params.get('as');
  const next = params.get('next') ?? '';
  const isApplicant = preset === 'applicant';
  const [email, setEmail] = useState(preset && DEMO[preset] ? DEMO[preset].email : '');
  const [password, setPassword] = useState(preset && DEMO[preset] ? DEMO_PASSWORD : '');
  const [state, action, pending] = useActionState(signIn, undefined);

  const signInForm = (
    <>
      {state?.error && <p className="err" role="alert" data-testid="login-error">{state.error}</p>}
      <form action={action} className="stack" style={{ marginTop: 10 }}>
        <input type="hidden" name="next" value={next} />
        <div><label className="f" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="in" required value={email} onChange={e => setEmail(e.target.value)} data-testid="email" /></div>
        <div><label className="f" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="in" required value={password} onChange={e => setPassword(e.target.value)} data-testid="password" /></div>
        <button className="btn big" type="submit" disabled={pending} data-testid="signin">{pending ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </>
  );

  // ---- Applicant entry: lead with "Start an application" ----
  if (isApplicant) {
    return (
      <main className="portal-body" id="main">
        <div className="card auth-card"><div className="bd">
          <h1 style={{ fontSize: 22 }}>Apply for benefits</h1>
          <p className="muted small" style={{ margin: '6px 0 16px' }}>
            Start a new application now — no account needed to begin. You&rsquo;ll create one when you submit.
          </p>
          <Link className="btn big" href="/portal/apply" data-testid="start-application" style={{ display: 'block', textAlign: 'center' }}>
            Start an application →
          </Link>
        </div></div>

        <div className="card auth-card" style={{ marginTop: 16 }}><div className="bd">
          <div className="eyebrow">Already have an account? Sign in</div>
          {signInForm}
          <div className="demo-creds">
            <div className="eyebrow" style={{ marginTop: 14 }}>Demo applicant (click to fill)</div>
            <button type="button" data-testid="demo-applicant"
              onClick={() => { setEmail(DEMO.applicant.email); setPassword(DEMO_PASSWORD); }}>
              {DEMO.applicant.label} · <span className="mono">{DEMO.applicant.email}</span>
            </button>
          </div>
          <p className="small" style={{ marginTop: 18 }}>
            New here? <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an applicant account</Link>. Every
            county&rsquo;s applicant login is on the <Link href="/guide/accounts">Accounts by County</Link> tab.
          </p>
        </div></div>
      </main>
    );
  }

  // ---- Staff / default: sign-in first ----
  return (
    <main className="portal-body" id="main">
      <div className="card auth-card"><div className="bd">
        <h1 style={{ fontSize: 22 }}>Sign in</h1>
        <p className="muted small" style={{ margin: '6px 0 18px' }}>CalSAWS Reimagined — every session is a real authenticated account.</p>
        {signInForm}
        <div className="demo-creds">
          <div className="eyebrow" style={{ marginTop: 14 }}>Demo accounts (click to fill)</div>
          {Object.entries(DEMO).map(([k, d]) => (
            <button key={k} type="button" data-testid={`demo-${k}`}
              onClick={() => { setEmail(d.email); setPassword(DEMO_PASSWORD); }}>
              {d.label} · <span className="mono">{d.email}</span>
            </button>
          ))}
        </div>
        <p className="small" style={{ marginTop: 18 }}>
          New here? <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an applicant account</Link> — or <Link href="/portal/apply">start an application</Link>.
        </p>
      </div></div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
