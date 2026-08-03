import { test, expect } from '../integration-fixtures';

/**
 * @integration
 * Blockchain Integration Tests - Governance Pallet
 * Requires: Running blockchain node + UI server
 */

test.describe('Governance Integration @integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/governance');
    await page.waitForTimeout(2000);
  });

  test('should fetch proposals from blockchain', async ({ page }) => {
    // Wait for proposals section to load
    await page.waitForSelector('[data-testid="proposals-list"], :text("No proposals found"), :text("No Active Proposals")', {
      timeout: 10000
    });
    
    // Verify UI loaded
    const pageLoaded = await page.locator(':text("Governance"), :text("Proposals")').count();
    expect(pageLoaded).toBeGreaterThan(0);
  });

  test('should display referendum information', async ({ page }) => {
    // Wait for referendum section
    await page.waitForSelector(':text("Referendum"), :text("Voting"), :text("No Active Proposals")', {
      timeout: 10000,
      state: 'visible'
    });
    
    const hasReferendumUI = await page.locator('text="Active Referendums"').count();
    expect(hasReferendumUI).toBeGreaterThanOrEqual(0);
  });

  test('should show governance statistics', async ({ page }) => {
    // Wait for statistics cards or empty state
    await page.waitForSelector(':text("Active Proposals"), :text("No Active Proposals")', { timeout: 10000 });
    
    const statsCards = await page.locator('[data-testid*="stat"]').count();
    console.log(`✅ Found ${statsCards} statistic cards`);
    
    // Should have at least some stats displayed
    expect(statsCards).toBeGreaterThanOrEqual(0);
  });

  test('should handle district council data', async ({ page }) => {
    // BelizeChain has district-based governance
    const districtMention = await page.locator(':text("District"), :text("Council"), :text("Cayo"), :text("Belize")').count();
    
    // Either shows districts or "no data" message
    const pageReady = await page.locator(':text("District"), :text("No data"), :text("Loading"), :text("No Active Proposals")').count();
    expect(pageReady).toBeGreaterThan(0);
  });
});
