// Person search / clearance — staff only, searches across all persons.
import Link from 'next/link';
import { getStaffContext } from '@/lib/auth-helpers';
import { ProgPill, StatusPill } from '@/components/ui';
import type { Program } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase, profile } = await getStaffContext();

  let hits: { person: { name: string; dob: string | null; ssn: string | null }; c: { id: string; case_number: string; county: string; status: string; programs: Program[] } }[] = [];
  if (q && q.trim()) {
    const { data } = await supabase.from('persons')
      .select('name, dob, ssn, cases(id, case_number, county, status, programs)')
      .or(`name.ilike.%${q.trim()}%,ssn.ilike.%${q.trim()}%`)
      .limit(25);
    hits = (data ?? []).filter(p => p.cases).map(p => ({
      person: p, c: p.cases as unknown as typeof hits[0]['c'],
    }));
  }

  return (
    <>
      <h1 style={{ fontSize: 23 }}>Person search & clearance</h1>
      <p className="muted small" style={{ margin: '4px 0 18px' }}>Search before registering — one person, one case. Try “Reyes”, “Nguyen”, or an SSN fragment.</p>
      <form className="row" style={{ maxWidth: 560 }} action="/worker/search" method="get">
        <input name="q" className="in" placeholder="Name or SSN" defaultValue={q ?? ''} data-testid="search-q" />
        <button className="btn" type="submit" data-testid="search-go">Search</button>
      </form>
      {q && (
        <div style={{ marginTop: 18 }}>
          {hits.length ? (
            <div className="card"><div className="tblwrap"><table className="tbl">
              <thead><tr><th>Person</th><th>SSN</th><th>Case</th><th>County</th><th>Status</th><th>Programs</th></tr></thead>
              <tbody>
                {hits.map((h, i) => (
                  <tr key={i}>
                    <td><strong>{h.person.name}</strong></td>
                    <td className="mono small">{h.person.ssn ?? '—'}</td>
                    <td className="mono"><Link href={`/case/${h.c.id}`}>{h.c.case_number}</Link></td>
                    <td>{h.c.county}</td>
                    <td><StatusPill s={h.c.status} /></td>
                    <td>{(h.c.programs ?? []).map(p => <ProgPill key={p} p={p} />)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div></div>
          ) : (
            <div className="banner good">✅ No existing person matches “{q}” — clear to register a new case.</div>
          )}
        </div>
      )}
    </>
  );
}
