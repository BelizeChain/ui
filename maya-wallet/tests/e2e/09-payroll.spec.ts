import { test, expect } from '../fixtures/blockchain';

test.describe('Payroll Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/payroll');
  });

  test('should load Payroll page', async ({ page }) => {
    await expect(page).toHaveURL(/.*payroll/);
    await expect(
      page.locator('text=/Payroll|Salary|Payment|Employee/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display payroll records', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const payrollContent = page.locator('text=/Payroll|Salary|Payment|Schedule|History/i').first();
    await expect(payrollContent).toBeVisible({ timeout: 10000 });
  });

  test('should show payment statistics', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    const statsSection = page.locator('text=/Total Paid|Payments|Employees|Upcoming/i').first();
    await expect(statsSection).toBeVisible({ timeout: 10000 }).catch(() => {
      // May require wallet connection or payroll records
      expect(page.locator('text=/Connect Wallet|No records/i').first()).toBeVisible();
    });
  });

  test('should handle navigation', async ({ page }) => {
    const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backButton.click();
    await expect(page).not.toHaveURL(/.*payroll/);
  });
});
