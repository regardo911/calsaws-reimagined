// Worker dashboard — live task queue with SLA countdowns. RLS-scoped staff reads.
import Link from 'next/link';
import { getStaffContext } from '@/lib/auth-helpers';
import { fdate, type DbCase } from '@/lib/domain';
import { ProgPill, SlaChip, PriorityPill, Tile } from '@/components/ui';
import type { Program } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export default async function WorkerDashboard() {
  const { supabase, profile } = await getStaffContext();
  const { data: tasks } = await supabase
    .from('tasks').select('*, cases(*, persons(name, role)), profiles:assigned_to(full_name)')
    .eq('status', 'open').order('due_date');

  // Rank by priority (Critical > High > Normal), then by due date.
  const prank = (p: string) => (p === 'Critical' ? 0 : p === 'High' ? 1 : 2);
  const rows = (tasks ?? [])
    .filter(t => t.cases)
    .map(t => {
      // SLA chip is driven by the task's own due_date (correct for renewals / supervisor-returned tasks).
      const due = new Date(t.due_date + (t.due_date.length === 10 ? 'T12:00:00' : ''));
      const left = Math.ceil((due.getTime() - Date.now()) / 86400000);
      return { t, c: t.cases as DbCase & { id: string }, sla: { left, overdue: left < 0, atRisk: left >= 0 && left <= 5 } };
    })
    .sort((a, b) => prank(a.t.priority) - prank(b.t.priority) || a.t.due_date.localeCompare(b.t.due_date));

  const mine = profile.role === 'worker' ? rows.filter(r => r.t.assigned_to === profile.id) : rows;
  // Tiles count the same set the table renders (assigned-to-me for workers) so tiles and table agree.
  const expedited = mine.filter(r => r.t.priority === 'Critical');
  const atRisk = mine.filter(r => r.sla.atRisk);
  const overdue = mine.filter(r => r.sla.overdue);

  return (
    <>
      <h1 style={{ fontSize: 23 }}>Work queue</h1>
      <p className="muted small" style={{ margin: '4px 0 18px' }}>
        Every application below is live in the database — open a task, run EDBC, and the decision, notice, and issuance happen in real time.
      </p>
      <div className="grid g4" style={{ marginBottom: 20 }}>
        <Tile v={mine.length} l={profile.role === 'worker' ? 'My open tasks' : 'Open tasks'} />
        <Tile v={expedited.length} l="⚡ Expedited (3-day)" tone={expedited.length ? 'crit' : undefined} />
        <Tile v={atRisk.length} l="SLA at risk (≤5 days)" tone={atRisk.length ? 'warn' : undefined} />
        <Tile v={overdue.length} l="Overdue" tone={overdue.length ? 'crit' : undefined} />
      </div>
      <div className="card">
        <div className="hd"><h2 style={{ fontSize: 16 }}>Tasks</h2></div>
        <div className="tblwrap"><table className="tbl">
          <thead><tr><th>Priority</th><th>Task</th><th>Case</th><th>Household</th><th>Programs</th><th>SLA</th><th>Due</th></tr></thead>
          <tbody data-testid="task-queue">
            {mine.map(({ t, c, sla }) => (
              <tr key={t.id} data-testid={`task-${c.case_number}`}>
                <td><PriorityPill p={t.priority} /></td>
                <td><strong><Link href={`/case/${c.id}`}>{t.type}</Link></strong>
                  {c.golden_tag && <><br /><span className="xs muted">{c.expected_note}</span></>}</td>
                <td className="mono"><Link href={`/case/${c.id}`}>{c.case_number}</Link></td>
                <td>{(() => {
                  const ps = (c as unknown as { persons: { name: string; role: string }[] }).persons ?? [];
                  const prim = ps.find(p => p.role === 'primary') ?? ps[0];
                  return prim ? <>{prim.name} <span className="muted">({ps.length})</span></> : '—';
                })()}</td>
                <td>{(c.programs as Program[]).map(p => <ProgPill key={p} p={p} />)}</td>
                <td><SlaChip left={sla.left} overdue={sla.overdue} atRisk={sla.atRisk} terminal={false} /></td>
                <td className="num small">{fdate(t.due_date)}</td>
              </tr>
            ))}
            {mine.length === 0 && <tr><td colSpan={7} className="muted" style={{ padding: 24, textAlign: 'center' }}>Queue clear 🎉</td></tr>}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
