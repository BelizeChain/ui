import { test, expect } from '@playwright/test';

test.describe('Blue Hole Dashboard', () => {
  test('renders the shell readiness panel on the dashboard', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Blue Hole Portal/i);
    await expect(page.locator('[data-testid="shell-readiness-panel"]')).toBeVisible();
    await expect(page.getByText('Portal shell readiness')).toBeVisible();
    await expect(page.getByText('Operator Wallet', { exact: true })).toBeVisible();
  });
});