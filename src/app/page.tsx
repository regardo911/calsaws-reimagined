// Landing — public. Live stats come straight from the database. This is the
// "Login here" tab of the site-wide tab bar (shared with the /guide pages).
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { money } from '@/lib/domain';
import GuideTabs from './guide/GuideTabs';
import './guide/guide.css';

export const dynamic = 'force-dynamic';

export default async function Landing() {
  const admin = createAdminClient();
  const [{ count: total }, { count: active }, { count: pending }, { data: iss }] = await Promise.all([
    admin.from('cases').select('*', { count: 'exact', head: true }),
    admin.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('cases').select('*', { count: 'exact', head: true }).in('status', ['pending', 'yellow_banner', 'pending_authorization']),
    admin.from('issuances').select('amount'),
  ]);
  const issued = (iss ?? []).reduce((s, i) => s + Number(i.amount), 0);

  const roles = [
    { href: '/login?as=applicant', icon: '🙋', name: 'Applicant', desc: 'Apply for benefits, check your case, read notices — the public BenefitsCal-style portal. Or create your own account.' },
    { href: '/login?as=worker', icon: '🗂️', name: 'Eligibility Worker', desc: 'Work the queue: registration, data collection, EDBC, notices — as Dana Whitfield, LA County.' },
    { href: '/login?as=supervisor', icon: '✅', name: 'Supervisor', desc: 'Authorize grants, reassign tasks, watch SLA timeliness — as Angela Ruiz.' },
    { href: '/login?as=admin', icon: '⚙️', name: 'Administrator', desc: 'Tune eligibility rules live, manage users, statewide reports — as Chris Yamamoto.' },
  ];

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/"><span className="seal">CA</span> CalSAWS <span style={{ fontWeight: 400, opacity: .75 }}>Reimagined</span></Link>
        <span className="env-chip">AI-built platform</span>
        <span className="spacer" />
        <Link href="/login" className="btn sm" style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.35)' }}>Sign in</Link>
      </header>
      <div className="landing-hero"><div className="inner">
        <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: 14 }}>California Statewide Automated Welfare System · rebuilt</div>
        <h1>The eligibility platform for 58 counties — reimagined end to end.</h1>
        <p style={{ fontSize: 18, opacity: .9, maxWidth: '38em', marginTop: 16 }}>
          One system for intake, eligibility determination, benefit calculation, case management, and reporting —
          multi-user, database-backed, with real-time explainable EDBC. Built by an AI team.
        </p>
        <div className="row wrap" style={{ marginTop: 26, gap: 24 }}>
          <div><div className="num" style={{ fontSize: 26, fontWeight: 750 }}>{total ?? 0}</div><div className="small" style={{ opacity: .8 }}>cases in system</div></div>
          <div><div className="num" style={{ fontSize: 26, fontWeight: 750 }}>{active ?? 0}</div><div className="small" style={{ opacity: .8 }}>active benefit cases</div></div>
          <div><div className="num" style={{ fontSize: 26, fontWeight: 750 }}>{pending ?? 0}</div><div className="small" style={{ opacity: .8 }}>in processing</div></div>
          <div><div className="num" style={{ fontSize: 26, fontWeight: 750 }}>{money(issued)}</div><div className="small" style={{ opacity: .8 }}>benefits issued</div></div>
        </div>
        <div className="row" style={{ alignItems: 'center', gap: 8, marginTop: 16 }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: '#3ddc84', boxShadow: '0 0 0 3px rgba(61,220,132,.22)' }} />
          <span className="small" style={{ opacity: .85, fontWeight: 600, letterSpacing: '.03em' }}>Live Data</span>
        </div>
      </div></div>

      {/* site-wide tab bar — this page is the "Login here" tab */}
      <div className="guide-nav"><div className="guide-nav-inner"><GuideTabs /></div></div>

      <main className="portal-body" id="main">
        <div className="eyebrow" style={{ marginBottom: 12 }}>Sign in as</div>
        <div className="grid g4">
          {roles.map(r => (
            <Link key={r.name} className="role-card" href={r.href} data-testid={`role-${r.name.toLowerCase().replace(/\s/g, '-')}`}>
              <div className="ric">{r.icon}</div><h3>{r.name}</h3>
              <p className="small muted" style={{ marginTop: 6 }}>{r.desc}</p>
            </Link>
          ))}
        </div>

        {/* How it was built — one positive statement */}
        <div className="card" style={{ marginTop: 34 }}><div className="bd" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span aria-hidden="true" style={{ color: 'var(--ok)', fontSize: 20, fontWeight: 800, lineHeight: 1, flexShrink: 0 }}>✓</span>
          <p style={{ margin: 0, fontSize: 16.5, fontWeight: 600, color: 'var(--ink)' }}>
            Built by a team of <strong>autonomous AI agents</strong>{' — '}Fable&nbsp;5 orchestrating Opus&nbsp;4.8.
          </p>
        </div></div>

        <p className="xs muted" style={{ marginTop: 20 }}>Synthetic caseload · every account, case, and determination lives in a real Postgres database. See how it was built in the tabs above.</p>
      </main>
    </>
  );
}
