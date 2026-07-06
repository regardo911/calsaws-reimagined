'use client';
// Yellow Banner resolution dialog — journaled server-side via SQL function.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveMatchAction } from '@/app/actions/case-actions';

export default function ResolveBanner({ caseId, matchId, reported, matched, small }: {
  caseId: string; matchId: string; reported: number; matched: number; small?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function resolve(useMatched: boolean) {
    setBusy(true);
    await resolveMatchAction(caseId, matchId, useMatched, useMatched ? 'Employer verified via IEVS.' : 'Match outdated per verification.');
    setOpen(false); setBusy(false);
    router.refresh();
  }

  return (
    <>
      <button className={`btn sm ${small ? 'ghost' : ''}`} onClick={() => setOpen(true)} data-testid="resolve-open">Review & resolve</button>
      {open && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <div className="bd" style={{ padding: 26 }}>
              <h3>Resolve income discrepancy</h3>
              <p className="small muted" style={{ margin: '8px 0 16px' }}>
                The match reports <strong>${matched.toLocaleString()}/mo</strong>; the case records <strong>${reported.toLocaleString()}/mo</strong>.
                Choose which verified amount is correct — the decision is journaled.
              </p>
              <div className="stack">
                <button className="btn" disabled={busy} onClick={() => resolve(true)} data-testid="resolve-matched">
                  Use matched amount — ${matched.toLocaleString()}/mo (employer-verified)
                </button>
                <button className="btn ghost" disabled={busy} onClick={() => resolve(false)} data-testid="resolve-reported">
                  Keep reported amount — ${reported.toLocaleString()}/mo (match outdated)
                </button>
                <button className="btn ghost sm" onClick={() => setOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
