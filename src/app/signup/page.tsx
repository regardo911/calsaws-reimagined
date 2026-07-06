'use client';
// Applicant self-signup — creates a real account (role: applicant, enforced
// server-side; users cannot choose a role).
import { useActionState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/app/actions/auth';

function SignupForm() {
  const params = useSearchParams();
  const next = params.get('next') ?? '';
  const [state, action, pending] = useActionState(signUp, undefined);
  return (
    <main className="portal-body" id="main">
      <div className="card auth-card"><div className="bd">
        <h1 style={{ fontSize: 22 }}>Create your account</h1>
        <p className="muted small" style={{ margin: '6px 0 18px' }}>Track your application, read notices, and manage your benefits.</p>
        {state?.error && <p className="err" role="alert" data-testid="signup-error">{state.error}</p>}
        <form action={action} className="stack" style={{ marginTop: 10 }}>
          <input type="hidden" name="next" value={next} />
          <div><label className="f" htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" className="in" required data-testid="full-name" /></div>
          <div><label className="f" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="in" required data-testid="email" /></div>
          <div><label className="f" htmlFor="password">Password (8+ characters)</label>
            <input id="password" name="password" type="password" className="in" required minLength={8} data-testid="password" /></div>
          <button className="btn big gold" type="submit" disabled={pending} data-testid="create-account">{pending ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="small" style={{ marginTop: 18 }}>Already have an account? <Link href="/login">Sign in</Link></p>
      </div></div>
    </main>
  );
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>;
}
