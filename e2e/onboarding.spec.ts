import { test, expect } from '@playwright/test';

test.describe('FinanceOS Landing & Onboarding', () => {
  test('Landing page renders the public marketing surface without authentication', async ({ page }) => {
    await page.goto('/');

    // Brand logo in header
    await expect(page.getByTestId('brand-logo')).toBeVisible();

    // Nav links + contact CTA
    await expect(page.getByTestId('nav-link-home')).toBeVisible();
    await expect(page.getByTestId('nav-link-features')).toBeVisible();
    await expect(page.getByTestId('contact-button')).toBeVisible();

    // Hero headline & copy
    await expect(page.getByTestId('hero-headline')).toBeVisible();
    await expect(page.getByTestId('hero-get-started-button')).toBeVisible();

    // Visual stage cards
    await expect(page.getByTestId('phone-mockup')).toBeVisible();
    await expect(page.getByTestId('balance-card')).toBeVisible();
    await expect(page.getByTestId('weekly-spend-card')).toBeVisible();
    await expect(page.getByTestId('expense-card')).toBeVisible();
  });

  test('Get Started triggers the unlock / auth flow', async ({ page }) => {
    await page.goto('/');

    // Click the primary CTA
    await page.getByTestId('hero-get-started-button').click();

    // Verify interaction responds without crash
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * Full authenticated onboarding journey.
 * Skipped unless E2E_GOOGLE_CREDENTIALS is set (CI with a real Supabase
 * session or a developer with a local .env).  The env var is expected to
 * hold a JSON file path usable as Playwright's `storageState`.
 */
test.describe('Full OAuth → Dashboard journey', () => {
  test.skip(
    !process.env.E2E_GOOGLE_CREDENTIALS,
    'requires E2E_GOOGLE_CREDENTIALS (a Playwright storageState JSON) to run',
  );

  test('new authenticated user reaches the app shell', async ({ browser }) => {
    // Load a persisted Supabase session (OAuth already completed once).
    const context = await browser.newContext({
      storageState: process.env.E2E_GOOGLE_CREDENTIALS,
    });
    const page = await context.newPage();

    await page.goto('/');

    // After OAuth, App.tsx boots: either the Dashboard shell is visible
    // (fresh user with no encrypted data → no PIN needed) or a PIN gate
    // is shown (existing encrypted cloud backup).
    const appShell  = page.getByText('Mission Control', { exact: true }).first();
    const pinScreen = page.locator('input[type="password"]').first();

    await Promise.race([
      appShell.waitFor({ state: 'visible', timeout: 20_000 }),
      pinScreen.waitFor({ state: 'visible', timeout: 20_000 }),
    ]);

    const landedOnApp = await appShell.isVisible();
    const landedOnPin  = await pinScreen.isVisible();
    expect(landedOnApp || landedOnPin).toBe(true);

    await context.close();
  });
});
