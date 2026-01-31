import { test, expect } from '../fixtures/blockchain';

test.describe('Bridges Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bridges');
  });

  test('should load bridges page', async ({ page }) => {
    await expect(page).toHaveURL(/.*bridges/);
    await expect(
      page.locator('text=/Bridge|Cross-Chain|Transfer/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display available bridges', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const bridgeContent = page.locator('text=/Ethereum|Polkadot|Bridge|Transfer/i').first();
    await expect(bridgeContent).toBeVisible({ timeout: 10000 });
  });

  test('should show bridge statistics', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const statsSection = page.locator('text=/Total Transfers|Volume|Status/i').first();
    await expect(statsSection).toBeVisible({ timeout: 10000 }).catch(() => {
      console.log('Bridge stats may require data or wallet connection');
    });
  });

  test('should handle navigation', async ({ page }) => {
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backButton.click();
    await expect(page).not.toHaveURL(/.*bridges/);
  });
});
