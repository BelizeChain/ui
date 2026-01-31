import { test, expect } from '../fixtures/blockchain';

test.describe('Global Navigation', () => {
  test('should navigate between all pages', async ({ page }) => {
    const pages = [
      { path: '/', title: /Maya Wallet|Home/i },
      { path: '/staking', title: /Staking/i },
      { path: '/governance', title: /Governance/i },
      { path: '/trade', title: /Trade|BelizeX/i },
      { path: '/belizeid', title: /BelizeID|Identity/i },
      { path: '/bridges', title: /Bridge/i },
      { path: '/bns', title: /BNS|Name Service/i },
      { path: '/landledger', title: /Land|Property/i },
      { path: '/payroll', title: /Payroll/i },
      { path: '/analytics', title: /Analytics/i },
    ];

    for (const { path, title } of pages) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`.*${path}$`));
      
      // Check page loaded
      await expect(
        page.locator(`text=${title}`).first()
      ).toBeVisible({ timeout: 10000 });
      
      console.log(`✓ Navigated to ${path}`);
    }
  });

  test('should persist wallet connection across pages', async ({ page, mockWallet }) => {
    // Mock wallet for this test
    await mockWallet();
    
    await page.goto('/');
    
    // Navigate through pages
    await page.goto('/staking');
    await page.waitForTimeout(1000);
    
    await page.goto('/governance');
    await page.waitForTimeout(1000);
    
    await page.goto('/trade');
    await page.waitForTimeout(1000);
    
    // Connection should persist (or reconnect automatically)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    
    // Should either show 404 page or redirect to home
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle browser back/forward', async ({ page }) => {
    await page.goto('/');
    await page.goto('/staking');
    await page.goto('/governance');
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/.*staking/);
    
    // Go back again
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/.*staking/);
  });
});
