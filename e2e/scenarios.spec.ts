// ============================================================================
// CalSAWS Reimagined v2 — the 8 anti-vaporware scenarios.
// Runs serially against a real Supabase database.
// ============================================================================
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { login, USERS, PASSWORD, expectNoConsoleErrors } from './helpers';

config({ path: '.env.local' }); config();
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const STAMP = Date.now();
const FRESH_EMAIL = `e2e.applicant.${STAMP}@demo.calsaws.test`;
let freshCaseNumber = '';

// ---------------------------------------------------------------------------
// Scenario 1 — THE MONEY TEST
// Fresh applicant signs up → applies → worker runs EDBC (CF $686 / CW $675)
// → accepts → supervisor authorizes → applicant sees NOAs + issuance.
// ---------------------------------------------------------------------------
test('1. fresh-applicant end-to-end loop', async ({ browser }) => {
  const errors: string[] = [];

  // -- applicant: sign up + apply --
  const appCtx = await browser.newContext();
  const app = await appCtx.newPage();
  app.on('console', m => m.type() === 'error' && errors.push(m.text()));

  await app.goto('/portal/apply');
  await app.getByTestId('person-name-0').fill('Erin Testerly');
  await app.getByTestId('person-age-0').fill('31');
  await app.getByTestId('add-person').click();
  await app.getByTestId('person-name-1').fill('Milo Testerly');
  await app.getByTestId('person-age-1').fill('6');
  await app.getByTestId('add-person').click();
  await app.getByTestId('person-name-2').fill('Nora Testerly');
  await app.getByTestId('person-age-2').fill('3');
  await app.getByTestId('next').click();
  await app.getByTestId('income').fill('1600');
  await app.getByTestId('resources').fill('250');
  await app.getByTestId('next').click();
  await app.getByTestId('rent').fill('1400');
  await app.getByTestId('next').click();
  await app.getByTestId('prog-CF').click();
  await app.getByTestId('prog-CW').click();
  await app.getByTestId('prog-MC').click();
  await app.getByTestId('next').click();
  await app.getByTestId('submit-application').click();

  // not signed in -> routed through signup, draft preserved
  await app.waitForURL(/\/signup/);
  await app.getByTestId('full-name').fill('Erin Testerly');
  await app.getByTestId('email').fill(FRESH_EMAIL);
  await app.getByTestId('password').fill(PASSWORD);
  await app.getByTestId('create-account').click();
  await app.waitForURL(/\/portal\/apply/);
  // draft restored at review step -> submit for real
  await app.getByTestId('submit-application').click();
  const caseEl = app.getByTestId('case-number');
  await expect(caseEl).toBeVisible({ timeout: 20_000 });
  freshCaseNumber = (await caseEl.textContent())!.trim();
  expect(freshCaseNumber).toMatch(/^C-2\d{5}$/);

  // -- worker: the case is in the queue; run EDBC; verify golden math --
  const wCtx = await browser.newContext();
  const w = await wCtx.newPage();
  w.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await login(w, USERS.worker);
  const row = w.getByTestId(`task-${freshCaseNumber}`);
  await expect(row).toBeVisible();
  await row.getByRole('link').first().click();
  await w.waitForURL(/\/case\//);
  await w.getByTestId('tab-edbc').click();
  await w.getByTestId('run-edbc').click();
  await expect(w.getByTestId('result-CF')).toHaveText('Eligible', { timeout: 20_000 });
  await expect(w.getByTestId('amount-CF')).toHaveText('$686/mo');   // FFY2026 golden math
  await expect(w.getByTestId('result-CW')).toHaveText('Eligible');
  await expect(w.getByTestId('amount-CW')).toHaveText('$675/mo');
  await expect(w.getByTestId('result-MC')).toHaveText('Eligible');
  await expect(w.getByTestId('edbc-trace').first()).toBeVisible();  // trace auto-open
  await w.getByTestId('accept-edbc').click();
  await expect(w.getByTestId('edbc-msg')).toContainText('supervisor', { timeout: 20_000 });

  // -- supervisor: authorize --
  const sCtx = await browser.newContext();
  const s = await sCtx.newPage();
  await login(s, USERS.supervisor);
  const authCard = s.getByTestId(`auth-${freshCaseNumber}`);
  await expect(authCard).toBeVisible();
  await authCard.getByTestId('authorize-approve').click();
  await expect(authCard).not.toBeVisible({ timeout: 20_000 });

  // -- applicant: sees approval NOAs + EBT issuances --
  await app.goto('/portal');
  const card = app.getByTestId(`case-${freshCaseNumber}`);
  await expect(card).toBeVisible();
  await expect(card.getByTestId('status-pill')).toHaveText('Active');
  await expect(card.getByTestId('notice-link').first()).toBeVisible();
  await expect(card.getByTestId('issuance-row').first()).toBeVisible();
  // open a NOA
  await card.getByTestId('notice-link').first().click();
  await expect(app.getByTestId('noa')).toBeVisible();

  await expectNoConsoleErrors(errors);
  await appCtx.close(); await wCtx.close(); await sCtx.close();
});

// ---------------------------------------------------------------------------
// Scenario 2 — Expedited screening at intake
// ---------------------------------------------------------------------------
test('2. homeless zero-income application flags expedited 3-day', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, USERS.applicant); // Maria submits a second application for a friend? No — use her account
  await page.goto('/portal/apply');
  await page.getByTestId('person-name-0').fill('Hank Streets');
  await page.getByTestId('person-age-0').fill('40');
  await page.getByTestId('next').click();
  await page.getByTestId('income').fill('0');
  await page.getByTestId('resources').fill('20');
  await page.getByTestId('next').click();
  await page.getByTestId('homeless').click();
  await page.getByTestId('next').click();
  await page.getByTestId('prog-CF').click();
  await page.getByTestId('next').click();
  await page.getByTestId('submit-application').click();
  await expect(page.getByTestId('expedited-callout')).toBeVisible({ timeout: 20_000 });
  const num = (await page.getByTestId('case-number').textContent())!.trim();

  // worker queue shows it as Critical
  const wCtx = await browser.newContext();
  const w = await wCtx.newPage();
  await login(w, USERS.worker);
  const row = w.getByTestId(`task-${num}`);
  await expect(row).toBeVisible();
  await expect(row).toContainText('Expedited Intake');
  await expect(row).toContainText('Critical');
  await ctx.close(); await wCtx.close();
});

// ---------------------------------------------------------------------------
// Scenario 3 — Yellow Banner blocks, resolve unblocks (golden GH5)
// ---------------------------------------------------------------------------
test('3. yellow banner blocks EDBC until resolved', async ({ browser }) => {
  const ctx = await browser.newContext();
  const w = await ctx.newPage();
  await login(w, USERS.worker);
  // find C-100005 via search
  await w.goto('/worker/search?q=Brooks');
  await w.getByRole('link', { name: 'C-100005' }).click();
  await w.waitForURL(/\/case\//);
  await expect(w.getByTestId('yellow-banner')).toBeVisible();
  await expect(w.getByTestId('yellow-banner')).toContainText('Full Case Review is required');
  // EDBC blocked
  await w.getByTestId('tab-edbc').click();
  await w.getByTestId('run-edbc').click();
  await expect(w.getByTestId('edbc-blocked')).toBeVisible({ timeout: 20_000 });
  // resolve with matched amount
  await w.getByTestId('resolve-open').first().click();
  await w.getByTestId('resolve-matched').click();
  await expect(w.getByTestId('yellow-banner')).not.toBeVisible({ timeout: 20_000 });
  // re-run: computes on corrected income ($2,400)
  await w.getByTestId('tab-edbc').click();
  await w.getByTestId('run-edbc').click();
  await expect(w.getByTestId('edbc-results')).toBeVisible({ timeout: 20_000 });
  await expect(w.getByTestId('result-CF')).toBeVisible();
  await ctx.close();
});

// ---------------------------------------------------------------------------
// Scenario 4 — RLS negative: an applicant cannot read another applicant's data
// ---------------------------------------------------------------------------
test('4. RLS: applicant A cannot see applicant B cases', async () => {
  const admin = createClient(SB_URL, SB_SERVICE, { auth: { persistSession: false } });
  const strangerEmail = `e2e.stranger.${STAMP}@demo.calsaws.test`;
  await admin.auth.admin.createUser({ email: strangerEmail, password: PASSWORD, email_confirm: true, user_metadata: { full_name: 'Sam Stranger' } });

  // stranger session: sees ZERO cases (has none; RLS hides everyone else's)
  const stranger = createClient(SB_URL, SB_ANON, { auth: { persistSession: false } });
  const { error: sErr } = await stranger.auth.signInWithPassword({ email: strangerEmail, password: PASSWORD });
  expect(sErr).toBeNull();
  const { data: strangerCases } = await stranger.from('cases').select('*');
  expect(strangerCases).toHaveLength(0);
  const { data: strangerNotices } = await stranger.from('notices').select('*');
  expect(strangerNotices).toHaveLength(0);
  const { data: strangerTasks } = await stranger.from('tasks').select('*');
  expect(strangerTasks).toHaveLength(0); // tasks are staff-only

  // Maria's session: sees her own case only
  const maria = createClient(SB_URL, SB_ANON, { auth: { persistSession: false } });
  await maria.auth.signInWithPassword({ email: USERS.applicant, password: PASSWORD });
  const { data: mariaCases } = await maria.from('cases').select('case_number');
  expect((mariaCases ?? []).length).toBeGreaterThanOrEqual(1);
  expect((mariaCases ?? []).every(c => !['C-100002', 'C-100003'].includes(c.case_number))).toBe(true);
});

// ---------------------------------------------------------------------------
// Scenario 5 — Role gates
// ---------------------------------------------------------------------------
test('5. role gates redirect non-staff and non-admin', async ({ browser }) => {
  const aCtx = await browser.newContext();
  const a = await aCtx.newPage();
  await login(a, USERS.applicant);
  await a.goto('/worker');
  await a.waitForURL(/\/portal/);
  await a.goto('/admin');
  await a.waitForURL(/\/portal/);

  const wCtx = await browser.newContext();
  const w = await wCtx.newPage();
  await login(w, USERS.worker);
  await w.goto('/admin');
  await w.waitForURL(/\/worker/);
  await aCtx.close(); await wCtx.close();
});

// ---------------------------------------------------------------------------
// Scenario 6 — Admin rule change flips a live determination
// ---------------------------------------------------------------------------
test('6. admin param change recomputes GA grant to $400', async ({ browser }) => {
  const admCtx = await browser.newContext();
  const adm = await admCtx.newPage();
  await login(adm, USERS.admin);
  await adm.goto('/admin');
  await adm.getByTestId('param-ga.grant').fill('400');
  await adm.getByTestId('save-rules').click();
  await expect(adm.getByTestId('rules-msg')).toBeVisible({ timeout: 20_000 });

  const wCtx = await browser.newContext();
  const w = await wCtx.newPage();
  await login(w, USERS.worker);
  await w.goto('/worker/search?q=Carter');
  await w.getByRole('link', { name: 'C-100002' }).click();
  await w.getByTestId('tab-edbc').click();
  // GA only, so nothing else is affected
  await w.getByTestId('edbc-prog-CF').click(); // deselect CF
  await w.getByTestId('edbc-prog-MC').click(); // deselect MC
  await w.getByTestId('run-edbc').click();
  await expect(w.getByTestId('amount-GA')).toHaveText('$400/mo', { timeout: 20_000 });

  // restore
  await adm.getByTestId('param-ga.grant').fill('221');
  await adm.getByTestId('save-rules').click();
  await expect(adm.getByTestId('rules-msg')).toBeVisible();
  await admCtx.close(); await wCtx.close();
});

// ---------------------------------------------------------------------------
// Scenario 7 — Persistence: everything survives a fresh browser context
// ---------------------------------------------------------------------------
test('7. state persists across fresh sessions (database-backed)', async ({ browser }) => {
  const ctx = await browser.newContext(); // brand-new cookies, no cache
  const page = await ctx.newPage();
  await login(page, USERS.applicant);
  // the money-test case (approved in scenario 1) is still active with issuances
  const card = page.getByTestId(`case-${freshCaseNumber}`);
  // Maria's portal shows only her cases; the fresh case belongs to Erin. Verify via Erin instead.
  await page.getByTestId('signout').isVisible().catch(() => {});
  await ctx.close();

  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await login(page2, FRESH_EMAIL);
  await expect(page2.getByTestId(`case-${freshCaseNumber}`)).toBeVisible();
  await expect(page2.getByTestId(`case-${freshCaseNumber}`).getByTestId('status-pill')).toHaveText('Active');
  await ctx2.close();
});

// ---------------------------------------------------------------------------
// Scenario 8 — Health + reports reflect reality
// ---------------------------------------------------------------------------
test('8. health check green and reports reconcile', async ({ browser, request }) => {
  const health = await request.get('/api/health');
  expect(health.ok()).toBe(true);
  const body = await health.json();
  expect(body.ok).toBe(true);
  expect(body.seeded).toBe(true);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, USERS.supervisor);
  await page.goto('/reports');
  await expect(page.getByTestId('report-tiles')).toBeVisible();
  // CSV export works and contains the fresh case
  const csv = await page.request.get(`/reports/csv?tab=dash&county=All`);
  expect(csv.ok()).toBe(true);
  const text = await csv.text();
  expect(text).toContain('case_number');
  expect(text).toContain(freshCaseNumber);
  await ctx.close();
});
