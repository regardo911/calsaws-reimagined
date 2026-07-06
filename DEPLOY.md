# Deploy — Vercel + Supabase runbook

The repo is ready to import. Total time: ~10 minutes.

## 1. Supabase (already provisioned by the build)

Project: **calsaws** (dedicated — nothing else runs in it).
Migrations in `supabase/migrations/` are applied and the database is seeded
(4 demo auth users + 50-case synthetic caseload + rule defaults).

To re-apply from scratch on a new project:
1. Supabase Dashboard → SQL Editor → run `0001_schema.sql`, then `0002_rls.sql`.
2. Locally: `.env.local` with the project keys → `npm run db:seed`.

## 2. Vercel import

1. vercel.com → **Add New → Project → Import Git Repository** → select `calsaws-reimagined`.
2. Framework preset: **Next.js** (auto-detected). Build command / output: defaults.
3. **Environment variables** (Project → Settings → Environment Variables, all three environments):

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/public key | safe for the browser (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **server-only** — never referenced client-side |

4. Deploy.

## 3. Post-deploy checklist

- [ ] `https://<your-app>.vercel.app/api/health` → `{ ok: true, seeded: true }`
- [ ] Landing page shows live caseload stats (≈50 cases).
- [ ] Sign in as `worker.dana@demo.calsaws.test` / `CalSAWS-demo-2026!` → queue renders with SLA chips.
- [ ] Open C-100001 → EDBC tab → Run EDBC → CF **$686** / CW **$675** with trace.
- [ ] Sign up with a brand-new email → apply → the case appears in Dana's queue.
- [ ] Optional: run the e2e suite against production —
      `E2E_BASE_URL=https://<your-app>.vercel.app npm run test:e2e`

## Notes

- Auth: demo accounts are pre-confirmed; self-signup is confirmed server-side (no SMTP needed).
- The `Reset demo data` button (Admin → Rules) restores the seed state without touching auth users.
- Vercel serverless region: any US region is fine; the Supabase project is in `us-east-1`.
