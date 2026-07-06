// Applicant "My benefits" — RLS-scoped: this page's queries run as the
// signed-in user, so only their own case graph is visible.
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { loadParams } from '@/lib/rules';
import { slaInfo, fdate, money, PROG } from '@/lib/domain';
import { ProgPill, StatusPill } from '@/components/ui';
import { signOut } from '@/app/actions/auth';
import type { Program } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export default async function PortalHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('auth_user_id', user!.id).single();
  const { data: cases } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
  const ids = (cases ?? []).map(c => c.id);
  const [{ data: notices }, { data: issuances }] = await Promise.all([
    supabase.from('notices').select('*').in('case_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']).order('date', { ascending: false }),
    supabase.from('issuances').select('*').in('case_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']).order('date', { ascending: false }),
  ]);
  const P = await loadParams();

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/portal"><span className="seal">CA</span> BenefitsCal <span style={{ fontWeight: 400, opacity: .75 }}>· Reimagined</span></Link>
        <span className="spacer" />
        <div className="who"><strong data-testid="whoami">{profile?.full_name}</strong></div>
        <form action={signOut}><button type="submit">Sign out</button></form>
      </header>
      <main className="portal-body" id="main" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="row wrap" style={{ justifyContent: 'space-between', margin: '20px 0' }}>
          <h1 style={{ fontSize: 26 }}>My benefits</h1>
          <Link className="btn gold" href="/portal/apply">Apply for more benefits</Link>
        </div>
        {(cases ?? []).length === 0 && (
          <div className="card"><div className="bd" style={{ textAlign: 'center', padding: 40 }}>
            <p className="muted">No cases yet.</p>
            <div className="row" style={{ justifyContent: 'center', marginTop: 16, gap: 12 }}>
              <Link className="btn gold big" href="/portal/apply">Apply for benefits</Link>
              <Link className="btn ghost big" href="/portal/prescreen">Am I eligible?</Link>
            </div>
          </div></div>
        )}
        <div className="stack" style={{ gap: 16 }}>
          {(cases ?? []).map(c => {
            const sla = slaInfo(c, P);
            const myNotices = (notices ?? []).filter(n => n.case_id === c.id).slice(0, 4);
            const myIss = (issuances ?? []).filter(i => i.case_id === c.id).slice(0, 3);
            const inFlight = ['pending', 'yellow_banner', 'pending_authorization'].includes(c.status);
            return (
              <div className="card" key={c.id} data-testid={`case-${c.case_number}`}>
                <div className="hd">
                  <strong className="mono">{c.case_number}</strong>
                  <StatusPill s={c.status} />
                  {c.expedited && <span className="pill crit">⚡ Expedited</span>}
                  <span style={{ flex: 1 }} /><span className="small muted">{c.county} County</span>
                </div>
                <div className="bd">
                  <div className="row wrap" style={{ marginBottom: 10 }}>
                    {(c.programs as Program[]).map(p => <ProgPill key={p} p={p} />)}
                  </div>
                  {inFlight && (
                    <div className="banner info">Your application from {fdate(c.application_date)} is being reviewed.
                      You’ll have a decision by <strong>{fdate(sla.due)}</strong>{c.expedited ? ' — expedited 3-day service' : ''}.</div>
                  )}
                  {myNotices.length > 0 && (<>
                    <div className="eyebrow" style={{ margin: '14px 0 8px' }}>My notices</div>
                    <div className="stack" style={{ gap: 6 }}>
                      {myNotices.map(n => (
                        <Link key={n.id} href={`/portal/noa/${n.id}`} className="row" data-testid="notice-link"
                          style={{ justifyContent: 'space-between', textDecoration: 'none', color: 'inherit', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 13px' }}>
                          <span>{n.type === 'Approval NOA' ? '🟢' : '🔴'} {PROG[n.program as Program]?.name} — {n.type}</span>
                          <span className="small muted num">{fdate(n.date)}</span>
                        </Link>
                      ))}
                    </div>
                  </>)}
                  {myIss.length > 0 && (<>
                    <div className="eyebrow" style={{ margin: '14px 0 8px' }}>EBT</div>
                    {myIss.map(i => (
                      <div key={i.id} className="row small" style={{ justifyContent: 'space-between' }} data-testid="issuance-row">
                        <span>{PROG[i.program as Program]?.name} · {fdate(i.date)}</span>
                        <strong className="num">{money(Number(i.amount))}</strong>
                      </div>
                    ))}
                  </>)}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
