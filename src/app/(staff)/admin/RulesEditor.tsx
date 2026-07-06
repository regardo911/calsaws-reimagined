'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveParamsAction, resetDemoAction } from '@/app/actions/case-actions';

export default function RulesEditor({ rows }: { rows: { path: string; value: number; label: string; grp: string }[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>(Object.fromEntries(rows.map(r => [r.path, r.value])));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const groups = [...new Set(rows.map(r => r.grp))];

  async function saveAll() {
    setBusy(true); setMsg('');
    try {
      const res = await saveParamsAction(rows.map(r => ({ path: r.path, value: values[r.path] })));
      setMsg(`Rules saved (${res.count}) — determinations recompute on the next EDBC run, for everyone.`);
      router.refresh();
    } catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  }
  async function reset() {
    if (!confirm('Reset demo data? Cases, tasks, notices, and rules return to the seed state. Accounts are kept.')) return;
    setBusy(true); setMsg('');
    try {
      const res = await resetDemoAction();
      setMsg(`Demo data reset — ${(res as { cases: number }).cases} cases reseeded.`);
      router.refresh();
    } catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  }

  return (
    <>
      {msg && <div className="banner good small" style={{ marginBottom: 14 }} data-testid="rules-msg">{msg}</div>}
      <div className="grid g2">
        {groups.map(g => (
          <div className="card" key={g}>
            <div className="hd"><h3 style={{ fontSize: 15 }}>{g}</h3></div>
            <div className="bd stack">
              {rows.filter(r => r.grp === g).map(r => (
                <div className="row" key={r.path} style={{ justifyContent: 'space-between', gap: 14 }}>
                  <label className="small" htmlFor={`p-${r.path}`} style={{ flex: 1 }}>{r.label}</label>
                  <input id={`p-${r.path}`} className="in num" type="number" step="any" style={{ width: 120 }}
                    value={values[r.path]} data-testid={`param-${r.path}`}
                    onChange={e => setValues(v => ({ ...v, [r.path]: +e.target.value }))} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 18, gap: 12 }}>
        <button className="btn big" onClick={saveAll} disabled={busy} data-testid="save-rules">Save rules</button>
        <button className="btn ghost" onClick={reset} disabled={busy} data-testid="reset-demo">♻️ Reset demo data</button>
      </div>
    </>
  );
}
