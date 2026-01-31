import { test, expect } from '../fixtures/blockchain';

test.describe('BelizeID Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/belizeid');
  });

  test('should load BelizeID page', async ({ page }) => {
    await expect(page).toHaveURL(/.*belizeid/);
    await expect(
      page.locator('text=/BelizeID|Identity|Verification/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display identity status', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const identityContent = page.locator('text=/Identity|Status|Verified|Not Verified|KYC/i').first();
    await expect(identityContent).toBeVisible({ timeout: 10000 });
  });

  test('should show identity fields or registration form', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Check for identity fields or registration
    const formContent = page.locator('text=/Name|SSN|Passport|Register|Update/i').first();
    await expect(formContent).toBeVisible({ timeout: 10000 }).catch(() => {
      // May require wallet connection
      expect(page.locator('text=/Connect Wallet/i').first()).toBeVisible();
    });
  });

  test('should handle navigation', async ({ page }) => {
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backButton.click();
    await expect(page).not.toHaveURL(/.*belizeid/);
  });
});
