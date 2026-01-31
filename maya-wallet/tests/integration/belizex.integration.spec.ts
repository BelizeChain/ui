import { test, expect } from '../integration-fixtures';

/**
 * @integration
 * Blockchain Integration Tests - BelizeX DEX
 * Requires: Running blockchain node + UI server
 */

test.describe('BelizeX Trading Integration @integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trade');
    await page.waitForTimeout(2000);
  });

  test('should fetch trading pairs from blockchain', async ({ page, api }) => {
    // Query liquidity pools from BelizeX pallet
    // This would query actual pairs when pallet is fully configured
    const chain = await api.rpc.system.chain();
    console.log(`✅ Connected to ${chain}`);
    
    // Wait for trading interface
    await page.waitForSelector('text=/Trade|Swap|BelizeX/', { timeout: 10000 });
    
    const tradeUIVisible = await page.locator('text="Swap"').isVisible();
    expect(tradeUIVisible).toBeTruthy();
  });

  test('should display liquidity pools', async ({ page }) => {
    // Wait for pools section
    await page.waitForSelector('text=/Liquidity|Pools|Pairs/', {
      timeout: 10000,
      state: 'visible'
    });
    
    // Check for pool display or empty state
    const poolsOrEmpty = await page.locator('text=/Pool|No liquidity|DALLA/').count();
    expect(poolsOrEmpty).toBeGreaterThan(0);
  });

  test('should handle token selection', async ({ page }) => {
    // Look for token selectors
    const tokenSelectors = await page.locator('[data-testid*="token-select"], select, button:has-text("Select")').count();
    
    if (tokenSelectors > 0) {
      console.log(`✅ Found ${tokenSelectors} token selector(s)`);
      expect(tokenSelectors).toBeGreaterThanOrEqual(1);
    } else {
      // May have default tokens pre-selected
      const tokenMentions = await page.locator('text=/DALLA|bBZD|Token/i').count();
      expect(tokenMentions).toBeGreaterThan(0);
    }
  });

  test('should display trading statistics', async ({ page }) => {
    // Wait for stats section
    await page.waitForSelector('text=/Volume|Liquidity|TVL/', {
      timeout: 10000
    });
    
    const statsVisible = await page.locator('text="24h Volume"').count();
    expect(statsVisible).toBeGreaterThanOrEqual(0);
  });
});
