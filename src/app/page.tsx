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

  // Before / after — for a 5-second executive skim.
  const beforeAfter: [string, string][] = [
    ['Built the traditional way — large vendor teams, multi-year, $1.025B across four systems (ISAWS · LEADER · C-IV · CalWIN)', 'Built by a team of autonomous AI agents — Fable 5 orchestrating Opus 4.8'],
    ['Four separate systems across 58 counties', 'One platform — each county sees only its own cases (Row-Level Security), verified by automated tests'],
    ['100+ portal screens · a 45-minute application', 'A guided application — done in minutes'],
    ['Overnight batch eligibility — a black box', 'Real-time determination with the math shown on screen'],
    ['28 weeks to train a new eligibility worker', 'An AI copilot explains any case, rule, or limit in seconds'],
    ['Paper reports at month-end', 'Live dashboards — CF 296 / CA 237 CW on demand'],
  ];
  const cell = { padding: '11px 16px', borderTop: '1px solid var(--line)', fontSize: 14.5, lineHeight: 1.4 } as const;

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

        {/* Before → After */}
        <div className="card" style={{ marginTop: 34 }}><div className="bd">
          <div className="eyebrow" style={{ marginBottom: 12 }}>The legacy system, reimagined with AI</div>
          <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: '11px 16px', fontWeight: 800, fontSize: 12.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--crit)', background: 'rgba(180,45,32,.09)' }}>Before · legacy CalSAWS</div>
            <div style={{ padding: '11px 16px', fontWeight: 800, fontSize: 12.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ok)', background: 'rgba(31,122,68,.11)', borderLeft: '1px solid var(--line)' }}>After · this platform</div>
            {beforeAfter.flatMap(([b, a], i) => [
              <div key={`b${i}`} style={{ ...cell, color: 'var(--ink-2)' }}><span style={{ color: 'var(--crit)', fontWeight: 800, marginRight: 7 }}>✕</span>{b}</div>,
              <div key={`a${i}`} style={{ ...cell, borderLeft: '1px solid var(--line)', color: 'var(--ink)', fontWeight: 600 }}><span style={{ color: 'var(--ok)', fontWeight: 800, marginRight: 7 }}>✓</span>{a}</div>,
            ])}
          </div>
        </div></div>

        <p className="xs muted" style={{ marginTop: 20 }}>Synthetic caseload · every account, case, and determination lives in a real Postgres database. See how it was built in the tabs above.</p>
      </main>
    </>
  );
}
