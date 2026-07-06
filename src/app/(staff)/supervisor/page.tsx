// Supervisor authorizations — CalWORKs grants and overrides land here.
import { getStaffContext } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { ProgPill, StatusPill } from '@/components/ui';
import { money } from '@/lib/domain';
import AuthorizeButtons from './AuthorizeButtons';
import Link from 'next/link';
import type { Program } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export default async function SupervisorPage() {
  const { supabase, profile } = await getStaffContext();
  if (!['supervisor', 'admin'].includes(profile.role)) redirect('/worker');

  const { data: queue } = await supabase
    .from('cases')
    .select('*, persons(name, role), edbc_runs(id, accepted, created_at, profiles:accepted_by(full_name), edbc_results(program, status, amount))')
    .eq('status', 'pending_authorization')
    .order('updated_at', { ascending: false });

  return (
    <>
      <h1 style={{ fontSize: 23 }}>Authorizations</h1>
      <p className="muted small" style={{ margin: '4px 0 18px' }}>CalWORKs grants and overrides route here before notices go out.</p>
      {(queue ?? []).length === 0 && <div className="banner good">✅ Nothing awaiting authorization.</div>}
      <div className="stack">
        {(queue ?? []).map(c => {
          const prim = (c.persons as { name: string; role: string }[]).find(p => p.role === 'primary');
          const run = (c.edbc_runs as any[]).filter(r => r.accepted).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
          return (
            <div className="card" key={c.id} data-testid={`auth-${c.case_number}`}>
              <div className="hd">
                <strong>{prim?.name}</strong><span className="mono muted">{c.case_number}</span>
                <StatusPill s={c.status} />
                <span style={{ flex: 1 }} />
                <span className="small muted">EW: {run?.profiles?.full_name ?? '—'}</span>
              </div>
              <div className="bd">
                {(run?.edbc_results ?? []).map((r: { program: Program; status: string; amount: number }, i: number) => (
                  <div className="row" key={i} style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                    <ProgPill p={r.program} />
                    {r.status === 'Eligible'
                      ? <span className="pill ok">Eligible · {money(Number(r.amount))}/mo</span>
                      : <span className="pill crit">Ineligible</span>}
                  </div>
                ))}
                <div className="row" style={{ marginTop: 14, gap: 10 }}>
                  <AuthorizeButtons caseId={c.id} />
                  <Link className="btn ghost sm" href={`/case/${c.id}`}>Open case</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
