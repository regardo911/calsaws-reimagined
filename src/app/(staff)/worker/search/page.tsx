// Person search / clearance — staff only. Cross-county duplicate clearance via
// the clear_person definer RPC (safe, county-independent). Rows for cases the
// caller may actually open (own county, or admin) resolve to a real case id via
// the RLS-scoped client and link through; cross-county duplicates are shown as
// read-only clearance signals (no case-graph exposure).
import Link from 'next/link';
import { getStaffContext } from '@/lib/auth-helpers';
import { StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { supabase } = await getStaffContext();

  const query = q?.trim() ?? '';
  let hits: { name: string; case_number: string; county: string; status: string }[] = [];
  const idByNumber = new Map<string, string>();
  if (query.length >= 2) {
    const { data } = await supabase.rpc('clear_person', { q: query });
    hits = data ?? [];
    const numbers = [...new Set(hits.map(h => h.case_number))];
    if (numbers.length) {
      // RLS returns an id only for cases the caller may open (own county / admin).
      const { data: visible } = await supabase.from('cases').select('id, case_number').in('case_number', numbers);
      for (const c of visible ?? []) idByNumber.set(c.case_number as string, c.id as string);
    }
  }

  return (
    <>
      <h1 style={{ fontSize: 23 }}>Person search &amp; clearance</h1>
      <p className="muted small" style={{ margin: '4px 0 18px' }}>Search before registering — one person, one case. Try “Reyes”, “Nguyen”, or an SSN fragment. Matches in other counties are shown for clearance but can’t be opened.</p>
      <form className="row" style={{ maxWidth: 560 }} action="/worker/search" method="get">
        <input name="q" className="in" placeholder="Name or SSN" defaultValue={q ?? ''} data-testid="search-q" />
        <button className="btn" type="submit" data-testid="search-go">Search</button>
      </form>
      {q && (
        <div style={{ marginTop: 18 }}>
          {query.length < 2 ? (
            <div className="banner info">Enter at least 2 characters to search.</div>
          ) : hits.length ? (
            <div className="card"><div className="tblwrap"><table className="tbl">
              <thead><tr><th>Name</th><th>Case #</th><th>County</th><th>Status</th></tr></thead>
              <tbody>
                {hits.map((h, i) => {
                  const id = idByNumber.get(h.case_number);
                  return (
                    <tr key={i}>
                      <td><strong>{h.name}</strong></td>
                      <td className="mono">
                        {id
                          ? <Link href={`/case/${id}`}>{h.case_number}</Link>
                          : <span title="Another county — clearance only">{h.case_number} <span className="muted xs">· other county</span></span>}
                      </td>
                      <td>{h.county}</td>
                      <td><StatusPill s={h.status} /></td>
                    </tr>
                  );
                })}
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
