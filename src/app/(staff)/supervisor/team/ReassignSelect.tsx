'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reassignTaskAction } from '@/app/actions/case-actions';

export default function ReassignSelect({ taskId, current, workers }: {
  taskId: string; current: string | null; workers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <select className="in" style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }} disabled={busy}
      defaultValue={current ?? ''} aria-label="Reassign task"
      onChange={async (e) => { setBusy(true); await reassignTaskAction(taskId, e.target.value); setBusy(false); router.refresh(); }}>
      {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
    </select>
  );
}
