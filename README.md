# CalSAWS Reimagined — v2 Platform

An AI-built, production-shaped reimagining of **CalSAWS** (the California Statewide Automated Welfare System):
multi-user eligibility determination (EDBC), benefit calculation, case management, notices, issuance, and live
reporting — **Next.js on Vercel + Supabase Postgres with Row-Level Security**. Synthetic data only.

## What's real

- **Server-side EDBC rules engine** (CalFresh, CalWORKs, Medi-Cal, GA/GR, CAPI, RCA) with full calculation traces,
  verified against golden households (`npm test`, 25 assertions). Rules live in the `rule_params` table — Admin edits
  change determinations for everyone, no deploy.
- **Real multi-user auth** (Supabase): open applicant self-signup + seeded staff accounts; roles enforced by
  middleware/server checks **and** database RLS.
- **Atomic workflow**: accept → notices + EBT issuances + status + task closure happens in a single SECURITY DEFINER
  SQL function. CalWORKs grants route to supervisor authorization.
- **End-to-end verified**: 8 Playwright scenarios (`npm run test:e2e`) including a full stranger-signs-up →
  applies → worker EDBC → supervisor authorizes → applicant-sees-benefits loop, an RLS negative test, and a
  live rule-change test.

## Demo accounts (password: `CalSAWS-demo-2026!`)

| Role | Email |
|---|---|
| Applicant | `applicant.maria@demo.calsaws.test` |
| Eligibility Worker | `worker.dana@demo.calsaws.test` |
| Supervisor | `supervisor.angela@demo.calsaws.test` |
| Administrator | `admin.chris@demo.calsaws.test` |

Or create your own applicant account via **Sign up** — it works identically.

## Setup from clone

```bash
npm install
cp .env.example .env.local            # fill in the calsaws Supabase project keys
# apply supabase/migrations/*.sql to the project (SQL editor or `supabase db push`)
npm run db:seed                       # demo users + 50-case synthetic caseload + rules
npm run dev
```

- `npm test` — engine golden-household suite (Vitest)
- `npm run test:e2e` — full end-to-end suite (Playwright; reseeds the DB first)
- `GET /api/health` — DB connectivity + seed status

## Deploy

See [DEPLOY.md](./DEPLOY.md) for the Vercel import runbook and environment-variable table.

## Layout

```
supabase/migrations/   schema + RLS + atomic workflow functions (SQL)
src/lib/engine.ts      EDBC engine (pure, traced, node-testable)
src/lib/params.ts      rule defaults + admin registry
src/lib/seed-core.ts   deterministic synthetic caseload (5 golden households + 45)
src/app/               portal (applicant) + (staff) worker/supervisor/admin/reports
src/proxy.ts           session refresh + role gating
tests/                 engine unit tests · e2e/  Playwright scenarios
```
