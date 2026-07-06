// Users & roles — profiles incl. CalSAWS-format Worker IDs.
import { getStaffContext } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const { supabase, profile } = await getStaffContext();
  if (profile.role !== 'admin') redirect('/worker');
  const { data: users } = await supabase.from('profiles').select('*').order('role').order('full_name');

  return (
    <>
      <h1 style={{ fontSize: 23 }}>Users & roles</h1>
      <p className="muted small" style={{ margin: '4px 0 16px' }}>
        Real authenticated accounts. Worker IDs follow the CalSAWS format: County + Department + Office + Unit + Position.
        New portal signups appear here as applicants.
      </p>
      <div className="card"><div className="tblwrap"><table className="tbl">
        <thead><tr><th>Name</th><th>Worker ID</th><th>Role</th><th>Title</th><th>County</th></tr></thead>
        <tbody data-testid="users-table">
          {(users ?? []).map(u => (
            <tr key={u.id}>
              <td><strong>{u.full_name}</strong></td>
              <td className="mono small">{u.worker_id ?? '—'}</td>
              <td><span className={`pill ${u.role === 'admin' ? 'gold' : u.role === 'supervisor' ? 'info' : ''}`}>{u.role}</span></td>
              <td>{u.title ?? '—'}</td><td>{u.county}</td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </>
  );
}
