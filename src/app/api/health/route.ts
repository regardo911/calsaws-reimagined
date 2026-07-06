// Health check: DB connectivity + schema version + seed presence.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const admin = createAdminClient();
    const [{ data: meta, error: e1 }, { count: cases }, { count: params }] = await Promise.all([
      admin.from('app_meta').select('value').eq('key', 'schema_version').single(),
      admin.from('cases').select('*', { count: 'exact', head: true }),
      admin.from('rule_params').select('*', { count: 'exact', head: true }),
    ]);
    if (e1) throw e1;
    return NextResponse.json({
      ok: true,
      schema_version: meta?.value ?? null,
      cases: cases ?? 0,
      rule_params: params ?? 0,
      seeded: (cases ?? 0) >= 50 && (params ?? 0) >= 20,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
