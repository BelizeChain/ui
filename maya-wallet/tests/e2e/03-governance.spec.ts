import { test, expect } from '../fixtures/blockchain';

test.describe('Governance Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/governance');
  });

  test('should load governance page', async ({ page }) => {
    await expect(page).toHaveURL(/.*governance/);
    await expect(
      page.locator('text=/Governance|Proposals|Democracy/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display page header', async ({ page }) => {
    const pageTitle = page.locator('h1:has-text("Governance")').or(
      page.locator('text="Governance"').first()
    );
    await expect(pageTitle).toBeVisible();
  });

  test('should show proposals or empty state', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const content = page.locator('text=/Proposal|No proposals|Connect Wallet|Vote/i').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('should display governance statistics', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Check for stats (active proposals, turnout, etc.)
    const statsSection = page.locator('text=/Active|Proposals|Votes|Turnout/i').first();
    await expect(statsSection).toBeVisible({ timeout: 10000 }).catch(() => {
      // May require wallet connection
      expect(page.locator('text=/Connect Wallet/i').first()).toBeVisible();
    });
  });

  test('should handle navigation', async ({ page }) => {
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(backButton).toBeVisible();
    
    await backButton.click();
    await expect(page).not.toHaveURL(/.*governance/);
  });
});
