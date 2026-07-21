import { test, expect } from '@playwright/test';

test.describe('FinanceOS Onboarding & Auth', () => {
  test('should allow a new user to set up a PIN and access the dashboard', async ({ page }) => {
    // 1. Go to the app
    await page.goto('/');

    // 2. Expect to be on the Setup page because DB is uninitialized
    // Assuming Setup.tsx renders a 'Welcome to FinanceOS' heading
    await expect(page.locator('text=FinanceOS')).toBeVisible();

    // 3. Fill in setup details
    const nameInput = page.locator('input[placeholder*="Name" i]');
    const pinInput = page.locator('input[placeholder*="PIN" i]');
    
    // In some cases the setup might ask for admin name and PIN
    // We try to fill whatever inputs are visible on the setup form
    if (await nameInput.isVisible()) {
      await nameInput.fill('Admin User');
    }
    
    if (await pinInput.isVisible()) {
      await pinInput.fill('123456');
      
      // If there's a confirm PIN
      const confirmInput = page.locator('input[placeholder*="Confirm" i]');
      if (await confirmInput.isVisible()) {
        await confirmInput.fill('123456');
      }
    }

    // 4. Submit setup
    const submitButton = page.locator('button', { hasText: /Get Started|Setup|Continue/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }

    // 5. App should redirect to Login or auto-login to Dashboard
    // Wait for either the Dashboard 'Net Worth' text or a Login prompt
    const dashboardText = page.locator('text=Net Worth');
    const loginText = page.locator('text=Enter PIN');
    
    await Promise.race([
      expect(dashboardText).toBeVisible({ timeout: 10000 }),
      expect(loginText).toBeVisible({ timeout: 10000 })
    ]);

    if (await loginText.isVisible()) {
      await page.locator('input[type="password"]').fill('123456');
      await page.locator('button', { hasText: /Login|Unlock/i }).click();
      await expect(dashboardText).toBeVisible({ timeout: 10000 });
    }

    // 6. Verify we are in the dashboard
    await expect(page.locator('text=Net Worth')).toBeVisible();
    await expect(page.locator('text=Accounts')).toBeVisible();
  });
});
