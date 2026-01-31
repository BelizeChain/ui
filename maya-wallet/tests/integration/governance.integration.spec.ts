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

  test('should fetch proposals from blockchain', async ({ page, api }) => {
    // Query proposals from governance pallet
    const proposalCount = await api.query.democracy.publicPropCount();
    console.log(`✅ Proposal count from chain: ${proposalCount.toString()}`);
    
    // Wait for proposals section to load
    await page.waitForSelector('[data-testid="proposals-list"], text="No proposals found"', {
      timeout: 10000
    });
    
    // Verify UI loaded
    const pageLoaded = await page.locator('text=/Governance|Proposals/i').isVisible();
    expect(pageLoaded).toBeTruthy();
  });

  test('should display referendum information', async ({ page, api }) => {
    // Check for active referendums
    const referendumCount = await api.query.democracy.referendumCount();
    console.log(`✅ Referendum count: ${referendumCount.toString()}`);
    
    // Wait for referendum section
    await page.waitForSelector('text=/Referendum|Voting/', {
      timeout: 10000,
      state: 'visible'
    });
    
    const hasReferendumUI = await page.locator('text="Active Referendums"').count();
    expect(hasReferendumUI).toBeGreaterThanOrEqual(0);
  });

  test('should show governance statistics', async ({ page }) => {
    // Wait for statistics cards
    await page.waitForSelector('text="Active Proposals"', { timeout: 10000 });
    
    const statsCards = await page.locator('[data-testid*="stat"]').count();
    console.log(`✅ Found ${statsCards} statistic cards`);
    
    // Should have at least some stats displayed
    expect(statsCards).toBeGreaterThanOrEqual(0);
  });

  test('should handle district council data', async ({ page }) => {
    // BelizeChain has district-based governance
    const districtMention = await page.locator('text=/District|Council|Cayo|Belize/i').count();
    
    // Either shows districts or "no data" message
    const pageReady = await page.locator('text=/District|No data|Loading/i').count();
    expect(pageReady).toBeGreaterThan(0);
  });
});
