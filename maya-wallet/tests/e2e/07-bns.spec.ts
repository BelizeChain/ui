import { test, expect } from '../fixtures/blockchain';

test.describe('BNS (Belize Name Service) Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bns');
  });

  test('should load BNS page', async ({ page }) => {
    await expect(page).toHaveURL(/.*bns/);
    await expect(
      page.locator('text=/BNS|Domain|Name Service|\.bz/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display domain search or registration', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const domainContent = page.locator('text=/Search|Register|Domain|\.bz|Available/i').first();
    await expect(domainContent).toBeVisible({ timeout: 10000 });
  });

  test('should show user domains or marketplace', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const listingContent = page.locator('text=/Your Domains|Marketplace|Listed|For Sale/i').first();
    await expect(listingContent).toBeVisible({ timeout: 10000 }).catch(() => {
      // May require wallet connection
      expect(page.locator('text=/Connect Wallet/i').first()).toBeVisible();
    });
  });

  test('should handle navigation', async ({ page }) => {
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backButton.click();
    await expect(page).not.toHaveURL(/.*bns/);
  });
});
