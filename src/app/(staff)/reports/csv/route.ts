// CSV export for the Reports module — staff-gated by proxy + RLS.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Program } from '@/lib/engine';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata?.calsaws_role as string) ?? 'applicant';
  if (!user || !['worker', 'supervisor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'staff role required' }, { status: 403 });
  }
  const county = req.nextUrl.searchParams.get('county') ?? 'All';
  const { data: casesAll } = await supabase.from('cases').select('*');
  const cases = (casesAll ?? []).filter(c => county === 'All' || c.county === county);
  const rows = [
    'case_number,county,programs,status,applied,expedited',
    ...cases.map(c => `${c.case_number},${c.county},"${(c.programs as Program[]).join('|')}",${c.status},${c.application_date},${c.expedited}`),
  ].join('\n');
  return new NextResponse(rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="calsaws-caseload-${county.toLowerCase().replace(/\s/g, '-')}.csv"`,
    },
  });
}
