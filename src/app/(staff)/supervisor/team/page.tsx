// Team & task management — live workload with reassignment.
import { getStaffContext } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { loadParams } from '@/lib/rules';
import { slaInfo, type DbCase } from '@/lib/domain';
import { PriorityPill, SlaChip, Tile } from '@/components/ui';
import ReassignSelect from './ReassignSelect';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const { supabase, profile } = await getStaffContext();
  if (!['supervisor', 'admin'].includes(profile.role)) redirect('/worker');
  const P = await loadParams();

  const [{ data: workers }, { data: tasks }] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'worker').order('full_name'),
    supabase.from('tasks').select('*, cases(*)').eq('status', 'open').order('due_date'),
  ]);
  const open = (tasks ?? []).filter(t => t.cases);

  return (
    <>
      <h1 style={{ fontSize: 23 }}>Team & task management</h1>
      <p className="muted small" style={{ margin: '4px 0 18px' }}>Live workload with SLA state. Reassign directly from the table — the move is journaled.</p>
      <div className="grid g4" style={{ marginBottom: 20 }}>
        {(workers ?? []).map(w => (
          <Tile key={w.id} v={open.filter(t => t.assigned_to === w.id).length} l={w.full_name} />
        ))}
      </div>
      <div className="card">
        <div className="hd"><h2 style={{ fontSize: 16 }}>All open tasks</h2></div>
        <div className="tblwrap"><table className="tbl">
          <thead><tr><th>Task</th><th>Case</th><th>Priority</th><th>SLA</th><th>Assigned to</th><th></th></tr></thead>
          <tbody>
            {open.map(t => {
              const c = t.cases as DbCase & { id: string };
              const sla = slaInfo(c, P);
              return (
                <tr key={t.id}>
                  <td><strong>{t.type}</strong></td>
                  <td className="mono"><Link href={`/case/${c.id}`}>{c.case_number}</Link></td>
                  <td><PriorityPill p={t.priority} /></td>
                  <td><SlaChip left={sla.left} overdue={sla.overdue} atRisk={sla.atRisk} terminal={false} /></td>
                  <td><ReassignSelect taskId={t.id} current={t.assigned_to} workers={(workers ?? []).map(w => ({ id: w.id, name: w.full_name }))} /></td>
                  <td><Link className="btn ghost sm" href={`/case/${c.id}`}>Open</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
