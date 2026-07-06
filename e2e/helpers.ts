import { Page, expect } from '@playwright/test';

export const PASSWORD = 'CalSAWS-demo-2026!';
export const USERS = {
  applicant: 'applicant.maria@demo.calsaws.test',
  worker: 'worker.dana@demo.calsaws.test',
  supervisor: 'supervisor.angela@demo.calsaws.test',
  admin: 'admin.chris@demo.calsaws.test',
};

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('signin').click();
  await page.waitForURL(/\/(portal|worker|supervisor|admin)/, { timeout: 20_000 });
}

export async function expectNoConsoleErrors(errors: string[]) {
  const real = errors.filter(e => !/favicon|404.*\.ico|hydrat/i.test(e));
  expect(real, `console errors: ${real.join(' | ')}`).toHaveLength(0);
}
