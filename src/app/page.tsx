// Landing — public. Live stats come straight from the database.
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { money } from '@/lib/domain';

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
  const contrast: [string, string][] = [
    ['$1.025B to build 4 systems', 'ISAWS, LEADER, C-IV, CalWIN — plus ~$178M/yr running three in parallel. → one platform, rebuilt by AI.'],
    ['100+ portal screens, 45-min application', '→ a guided application that skips what doesn’t apply — minutes, not an afternoon.'],
    ['Overnight batch EDBC', '→ real-time determination with a full plain-English calculation trace.'],
    ['28 weeks to train a new worker', '→ an eligibility copilot that explains any case, rule, and limit in seconds.'],
    ['Boilerplate legal notices', '→ plain-language NOAs generated per determination.'],
    ['Month-end paper reports', '→ live dashboards; CF 296 / CA 237 CW on demand, computed from the caseload.'],
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
          multi-user, database-backed, with real-time explainable EDBC. Built by AI.
        </p>
        <div className="row wrap" style={{ marginTop: 26, gap: 24 }}>
          <div><div className="num" style={{ fontSize: 26, fontWeight: 750 }}>{total ?? 0}</div><div className="small" style={{ opacity: .8 }}>cases in system</div></div>
          <div><div className="num" style={{ fontSize: 26, fontWeight: 750 }}>{active ?? 0}</div><div className="small" style={{ opacity: .8 }}>active benefit cases</div></div>
          <div><div className="num" style={{ fontSize: 26, fontWeight: 750 }}>{pending ?? 0}</div><div className="small" style={{ opacity: .8 }}>in processing</div></div>
          <div><div className="num" style={{ fontSize: 26, fontWeight: 750 }}>{money(issued)}</div><div className="small" style={{ opacity: .8 }}>benefits issued (90d)</div></div>
        </div>
      </div></div>
      <main className="portal-body" id="main">
        <div className="eyebrow" style={{ marginBottom: 12 }}>Enter as</div>
        <div className="grid g4">
          {roles.map(r => (
            <Link key={r.name} className="role-card" href={r.href} data-testid={`role-${r.name.toLowerCase().replace(/\s/g, '-')}`}>
              <div className="ric">{r.icon}</div><h3>{r.name}</h3>
              <p className="small muted" style={{ marginTop: 6 }}>{r.desc}</p>
            </Link>
          ))}
        </div>
        <div className="card" style={{ marginTop: 34 }}><div className="bd">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Then vs. now</div>
          <div className="grid g3">
            {contrast.map(([t, d]) => <div key={t}><strong>{t}</strong><p className="small muted">{d}</p></div>)}
          </div>
        </div></div>
        <div className="row wrap" style={{ marginTop: 24, alignItems: 'center', gap: 16 }}>
          <Link href="/guide" className="btn ghost sm">How this was built →</Link>
          <p className="xs muted" style={{ margin: 0 }}>Synthetic caseload · every account, case, and determination lives in a real Postgres database.</p>
        </div>
      </main>
    </>
  );
}
