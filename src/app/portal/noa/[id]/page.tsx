// NOA view — RLS-scoped: the query runs as the signed-in user, so a foreign
// notice id simply returns no rows.
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PROG, fdate, money } from '@/lib/domain';
import type { Program } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export default async function NoaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: n } = await supabase.from('notices').select('*, cases(case_number, county, address)').eq('id', id).maybeSingle();

  if (!n) {
    return (
      <main className="portal-body" id="main" style={{ maxWidth: 760, margin: '0 auto' }}>
        <p className="err" data-testid="noa-denied">Notice not found — or it belongs to a different account.</p>
        <Link href="/portal">← My benefits</Link>
      </main>
    );
  }
  const approve = n.type === 'Approval NOA';
  const c = n.cases as unknown as { case_number: string; county: string; address: string | null };
  const reasons: string[] = Array.isArray(n.reasons) ? n.reasons.map((r: unknown) => typeof r === 'string' ? r : (r as { text: string }).text) : [];

  return (
    <main className="portal-body" id="main" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="noa" data-testid="noa">
        <div className="nhead">
          <div>
            <div className="eyebrow">{c.county} County · CalSAWS Reimagined</div>
            <h2 style={{ marginTop: 6 }}>{approve ? 'Approval Notice' : 'Denial Notice'} — {PROG[n.program as Program]?.name}</h2>
          </div>
          <div style={{ textAlign: 'right' }} className="small">
            <div className="mono">{c.case_number}</div>
            <div className="muted num">{fdate(n.date)}</div>
          </div>
        </div>
        <div style={{ margin: '18px 0' }}>
          {approve
            ? (<><div className="amount-line" style={{ color: 'var(--ok)' }}>{Number(n.amount) > 0 ? `${money(Number(n.amount))} per month` : 'Approved'}</div>
              <p className="small" style={{ marginTop: 6 }}>{Number(n.amount) > 0 ? 'Loaded to your EBT card on the 3rd of each month.' : 'Your coverage is active.'}</p></>)
            : <div className="amount-line" style={{ color: 'var(--crit)' }}>Not approved</div>}
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Why</div>
        {reasons.map((r, i) => <p key={i} className="small" style={{ marginBottom: 6 }}>• {r}</p>)}
        <div className="rights">Your hearing rights: If you disagree with this decision you may ask for a state hearing within 90 days.
          You can keep getting benefits at the same amount while you wait if you ask before the change date.
          Call 1-800-952-5253 (TTY 1-800-952-8349) or ask your county office.</div>
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <Link className="btn ghost" href="/portal">← My benefits</Link>
      </div>
    </main>
  );
}
