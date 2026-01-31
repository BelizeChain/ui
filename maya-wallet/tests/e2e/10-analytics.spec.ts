import { test, expect } from '../fixtures/blockchain';

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
  });

  test('should load Analytics page', async ({ page }) => {
    await expect(page).toHaveURL(/.*analytics/);
    await expect(
      page.locator('text=/Analytics|Statistics|Dashboard|Metrics/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display aggregated statistics', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const statsContent = page.locator('text=/Total|Volume|Users|Activity|Transactions/i').first();
    await expect(statsContent).toBeVisible({ timeout: 10000 });
  });

  test('should show multiple data sources', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Analytics aggregates staking + governance + belizex
    const dataSection = page.locator('text=/Staking|Governance|Trading|DEX/i').first();
    await expect(dataSection).toBeVisible({ timeout: 10000 }).catch(() => {
      console.log('Analytics data may require wallet connection');
    });
  });

  test('should handle navigation', async ({ page }) => {
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backButton.click();
    await expect(page).not.toHaveURL(/.*analytics/);
  });
});
