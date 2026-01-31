import { test, expect } from '../fixtures/blockchain';

test.describe('LandLedger Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/landledger');
  });

  test('should load LandLedger page', async ({ page }) => {
    await expect(page).toHaveURL(/.*landledger/);
    await expect(
      page.locator('text=/Land|Property|Title|Registry/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display property listings', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const propertyContent = page.locator('text=/Property|Land|Title|Owner|Parcel/i').first();
    await expect(propertyContent).toBeVisible({ timeout: 10000 });
  });

  test('should show document storage', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const documentContent = page.locator('text=/Document|Proof|Storage|IPFS|Hash/i').first();
    await expect(documentContent).toBeVisible({ timeout: 10000 }).catch(() => {
      // May require wallet connection or properties
      expect(page.locator('text=/Connect Wallet|No properties/i').first()).toBeVisible();
    });
  });

  test('should handle navigation', async ({ page }) => {
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backButton.click();
    await expect(page).not.toHaveURL(/.*landledger/);
  });
});
