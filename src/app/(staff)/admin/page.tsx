// Admin — Rules & Config. Values live in rule_params; every EDBC run reads them.
import { getStaffContext } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import RulesEditor from './RulesEditor';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { supabase, profile } = await getStaffContext();
  if (profile.role !== 'admin') redirect('/worker');
  const { data: rows } = await supabase.from('rule_params').select('*').order('grp');

  return (
    <>
      <h1 style={{ fontSize: 23 }}>Rules & configuration</h1>
      <p className="muted small" style={{ margin: '4px 0 18px' }}>
        Every value below feeds the live EDBC engine for <strong>all users</strong>. Change one, re-run any case,
        and the determination moves — policy-as-configuration, no code release.
      </p>
      <RulesEditor rows={(rows ?? []).map(r => ({ path: r.path, value: Number(r.value), label: r.label, grp: r.grp }))} />
      <div className="banner info small" style={{ marginTop: 18 }}>
        Try it: set “GA/GR monthly grant” to 400, save, then run EDBC on James Carter (C-100002) — the grant
        recomputes instantly and the trace shows the new standard.
      </div>
    </>
  );
}
