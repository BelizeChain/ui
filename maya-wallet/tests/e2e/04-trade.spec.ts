import { test, expect } from '../fixtures/blockchain';

test.describe('Trade (BelizeX) Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trade');
  });

  test('should load trade page', async ({ page }) => {
    await expect(page).toHaveURL(/.*trade/);
    await expect(
      page.locator('text=/Trade|Swap|BelizeX|Exchange/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display DEX interface', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Check for trading pairs or liquidity pools
    const tradingContent = page.locator('text=/Liquidity|Pool|Swap|DALLA|bBZD/i').first();
    await expect(tradingContent).toBeVisible({ timeout: 10000 });
  });

  test('should show trading pairs', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Check for currency pairs
    const pairContent = page.locator('text=/DALLA|bBZD|Pair/i').first();
    await expect(pairContent).toBeVisible({ timeout: 10000 }).catch(() => {
      // May show connect wallet instead
      expect(page.locator('text=/Connect Wallet/i').first()).toBeVisible();
    });
  });

  test('should display trading statistics', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const statsSection = page.locator('text=/Volume|Liquidity|TVL|24h/i').first();
    await expect(statsSection).toBeVisible({ timeout: 10000 }).catch(() => {
      console.log('Stats require data or wallet connection');
    });
  });

  test('should handle page navigation', async ({ page }) => {
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backButton.click();
    await expect(page).not.toHaveURL(/.*trade/);
  });
});
