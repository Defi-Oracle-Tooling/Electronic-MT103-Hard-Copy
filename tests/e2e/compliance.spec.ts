import { test, expect } from '@playwright/test';

test.describe('Compliance E2E Tests', () => {
  test('complete compliance workflow', async ({ page }) => {
    await page.goto('/compliance/dashboard');
    
    // Check dashboard loads with key metrics
    await expect(page.locator('[data-testid="compliance-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="alerts-panel"]')).toBeVisible();

    // Test report generation
    await page.click('[data-testid="generate-report"]');
    await expect(page.locator('.report-status')).toHaveText('Generated');
    
    // Verify audit trail recording
    const auditEntries = page.locator('[data-testid="audit-entry"]');
    await expect(auditEntries).toHaveCount(2);
    await expect(auditEntries.first()).toContainText('Report Generated');
  });

  test('compliance alert handling', async ({ page }) => {
    await page.goto('/compliance/alerts');
    
    // Create test alert
    await page.click('[data-testid="create-alert"]');
    await page.fill('[data-testid="alert-description"]', 'Test Alert');
    await page.click('[data-testid="submit-alert"]');

    // Verify alert appears in list
    await expect(page.locator('[data-testid="alert-item"]')).toContainText('Test Alert');
    
    // Verify alert resolution workflow
    await page.click('[data-testid="resolve-alert"]');
    await expect(page.locator('[data-testid="alert-status"]')).toHaveText('Resolved');
  });
});
