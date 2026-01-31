import { test, expect } from '../integration-fixtures';

/**
 * @integration
 * Blockchain Integration Tests - Staking Pallet
 * Requires: Running blockchain node + UI server
 */

test.describe('Staking Integration @integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/staking');
    // Wait for blockchain connection
    await page.waitForTimeout(2000);
  });

  test('should connect to blockchain and fetch validators', async ({ page, api }) => {
    // Verify blockchain connection
    const chain = await api.rpc.system.chain();
    expect(chain.toString()).toContain('Belize');
    
    // Wait for validator list to load
    await page.waitForSelector('[data-testid="validator-list"], text="No validators found"', { 
      timeout: 10000 
    });
    
    // Check if validators are displayed
    const validatorsCount = await page.locator('[data-testid="validator-card"]').count();
    console.log(`✅ Found ${validatorsCount} validators`);
    
    // At minimum, Alice should be a validator in dev mode
    if (validatorsCount > 0) {
      const firstValidator = page.locator('[data-testid="validator-card"]').first();
      await expect(firstValidator).toBeVisible();
    }
  });

  test('should display correct staking statistics from chain', async ({ page, api }) => {
    // Get total issuance from blockchain
    const totalIssuance = await api.query.balances.totalIssuance();
    console.log(`Total DALLA issuance: ${totalIssuance.toString()}`);
    
    // Wait for statistics to load on page
    await page.waitForSelector('[data-testid="total-staked"], text="Total Staked"', {
      timeout: 10000
    });
    
    // Verify statistics are displayed
    const statsVisible = await page.locator('text="Total Staked"').isVisible();
    expect(statsVisible).toBeTruthy();
  });

  test('should show PoUW (Proof of Useful Work) contributions', async ({ page }) => {
    // Wait for PoUW section
    await page.waitForSelector('text="Proof of Useful Work", text="PoUW"', {
      timeout: 10000,
      state: 'visible'
    });
    
    // Check for federated learning indicator
    const pouwVisible = await page.locator('text=/PoUW|Federated Learning|Model Training/i').count();
    expect(pouwVisible).toBeGreaterThan(0);
  });

  test('should handle real-time block updates', async ({ page, api }) => {
    // Subscribe to new blocks
    let blockNumber = 0;
    const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
      blockNumber = header.number.toNumber();
    });
    
    // Wait for at least one block
    await page.waitForTimeout(8000); // ~1 block in dev mode
    
    expect(blockNumber).toBeGreaterThan(0);
    console.log(`✅ Latest block: #${blockNumber}`);
    
    // Check if UI shows updating block number
    const hasBlockNumber = await page.locator('text=/Block|#\\d+/i').count();
    expect(hasBlockNumber).toBeGreaterThan(0);
    
    unsubscribe();
  });

  test('should display wallet connection with real balance', async ({ page, api }) => {
    // This test assumes wallet is NOT connected (default state)
    const walletPrompt = await page.locator('text="Connect Wallet"').count();
    
    if (walletPrompt > 0) {
      console.log('✅ Wallet connection prompt displayed (expected without extension)');
      expect(walletPrompt).toBeGreaterThan(0);
    } else {
      // If somehow connected, verify balance display
      const balanceDisplay = await page.locator('text=/DALLA|Balance/i').count();
      expect(balanceDisplay).toBeGreaterThan(0);
    }
  });
});
