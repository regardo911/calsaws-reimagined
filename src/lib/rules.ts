// Load the live rule set: DEFAULT_PARAMS overlaid with rule_params rows.
// Reads via the service client so the engine always sees the full rule set
// (callers are role-checked before running the engine).
import { createAdminClient } from './supabase/server';
import { paramsFromRows, type Params } from './params';

export async function loadParams(): Promise<Params> {
  const admin = createAdminClient();
  const { data, error } = await admin.from('rule_params').select('path, value');
  if (error) throw new Error(`rule_params load failed: ${error.message}`);
  return paramsFromRows((data ?? []).map(r => ({ path: r.path as string, value: Number(r.value) })));
}
