import { test, expect } from '@playwright/test';

test.describe('FinanceOS Landing & Onboarding', () => {
  test('Landing page renders the public marketing surface without authentication', async ({ page }) => {
    await page.goto('/');

    // Brand heading in the sticky nav
    await expect(page.getByRole('heading', { name: 'MyFinanceOS' })).toBeVisible();

    // Nav links + auth CTA
    await expect(page.getByRole('link', { name: 'How It Works' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // Hero value prop
    await expect(page.getByText('One Secure Workspace.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started with Google' })).toBeVisible();

    // Trust badges below the hero
    await expect(page.getByText('100% Local-First')).toBeVisible();
    await expect(page.getByText('AES-256 Encryption')).toBeVisible();
  });

  test('Get Started triggers the auth flow (OAuth redirect or config error)', async ({ page }) => {
    await page.goto('/');

    // Click the primary CTA. Two outcomes are valid:
    //  • Supabase env vars set → redirects to accounts.google.com
    //  • Env vars missing    → inline error stays on the page
    await page.getByRole('button', { name: 'Get Started with Google' }).click();

    // Wait up to 15 s for either the redirect or the inline error.
    const errorMessage = page.getByText('Error authenticating with Google via Supabase.');
    const googleRedirect = page.waitForURL(/accounts\.google\.com|accounts\.google\.de|accounts\.google\.in/, { timeout: 15_000 });

    await Promise.race([
      googleRedirect.catch(() => null),
      errorMessage.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => null),
    ]);

    // At least one outcome must have occurred.
    const leftPage = !page.url().startsWith('http://localhost:3000/');
    const showedError = await errorMessage.isVisible();
    expect(leftPage || showedError).toBe(true);
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
