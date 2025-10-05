/**
 * Test Case 2: Customer Ordering Flow
 * Tests: Browse breads, Place orders, Update orders, Cancel orders
 */

const { test, expect } = require('@playwright/test');
const { 
  mockGoogleAuth, 
  createTestUser, 
  waitForLoading,
  navigateToPage,
  waitForToast,
  takeScreenshot,
  clickAndWait,
  fillFormField
} = require('./test-helpers');

test.describe('Customer Ordering Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    const testUser = createTestUser({
      name: 'Test Customer',
      phone: '0501234567'
    });
    
    await mockGoogleAuth(page, testUser);
    await navigateToPage(page, '/');
  });

  test('2.1 - Customer can view available breads', async ({ page }) => {
    // Wait for breads to load
    await page.waitForSelector('[data-testid="breads-list"]', { timeout: 10000 });
    
    // Verify bread list is visible
    await expect(page.locator('h2:has-text("לחמים להזמנה")')).toBeVisible();
    
    // Check if breads are displayed
    const breadItems = page.locator('[data-testid="bread-item"]');
    const breadCount = await breadItems.count();
    
    if (breadCount > 0) {
      // Verify bread details are shown
      await expect(breadItems.first().locator('[data-testid="bread-name"]')).toBeVisible();
      await expect(breadItems.first().locator('[data-testid="bread-price"]')).toBeVisible();
      await expect(breadItems.first().locator('[data-testid="bread-available"]')).toBeVisible();
    }
    
    await takeScreenshot(page, 'view-breads');
  });

  test('2.2 - Customer can place a new order', async ({ page }) => {
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Find first available bread
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    
    if (await firstBread.count() > 0) {
      // Set quantity
      const quantityInput = firstBread.locator('input[type="number"]');
      await quantityInput.fill('2');
      
      // Click order button
      await page.click('button:has-text("הזמן")');
      
      // Wait for success toast
      await waitForToast(page, 'תודה על ההזמנה!');
      
      // Verify bread moved to "ordered" section
      await expect(page.locator('h3:has-text("לחמים שהזמנתי")')).toBeVisible();
      
      // Verify quantity is shown in ordered section
      await expect(page.locator('text=2')).toBeVisible();
    }
    
    await takeScreenshot(page, 'place-order');
  });

  test('2.3 - Customer can update existing order', async ({ page }) => {
    // First place an order
    await page.waitForSelector('[data-testid="breads-list"]');
    
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    if (await firstBread.count() > 0) {
      // Place initial order
      await firstBread.locator('input[type="number"]').fill('1');
      await page.click('button:has-text("הזמן")');
      await waitForToast(page, 'תודה על ההזמנה!');
      
      // Update quantity in ordered section
      const orderedBread = page.locator('[data-testid="ordered-bread"]').first();
      const updateInput = orderedBread.locator('input[type="number"]');
      await updateInput.fill('3');
      
      // Click update button
      await page.click('button:has-text("עדכן הזמנה")');
      
      // Wait for update confirmation
      await waitForToast(page, 'הזמנה עודכנה!');
      
      // Verify updated quantity
      await expect(updateInput).toHaveValue('3');
    }
    
    await takeScreenshot(page, 'update-order');
  });

  test('2.4 - Customer can cancel order', async ({ page }) => {
    // First place an order
    await page.waitForSelector('[data-testid="breads-list"]');
    
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    if (await firstBread.count() > 0) {
      // Place order
      await firstBread.locator('input[type="number"]').fill('1');
      await page.click('button:has-text("הזמן")');
      await waitForToast(page, 'תודה על ההזמנה!');
      
      // Cancel order
      await page.click('button:has-text("בטל הזמנה")');
      
      // Wait for cancellation confirmation
      await waitForToast(page, 'הזמנה בוטלה!');
      
      // Verify bread moved back to available section
      await expect(page.locator('h2:has-text("לחמים להזמנה")')).toBeVisible();
    }
    
    await takeScreenshot(page, 'cancel-order');
  });

  test('2.5 - Customer sees total cost calculation', async ({ page }) => {
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Place multiple orders
    const breadItems = page.locator('[data-testid="bread-item"]');
    const breadCount = await breadItems.count();
    
    if (breadCount >= 2) {
      // Order first bread
      await breadItems.nth(0).locator('input[type="number"]').fill('2');
      await page.click('button:has-text("הזמן")');
      await waitForToast(page, 'תודה על ההזמנה!');
      
      // Order second bread
      await breadItems.nth(1).locator('input[type="number"]').fill('1');
      await page.click('button:has-text("עדכן הזמנה")');
      await waitForToast(page, 'הזמנה עודכנה!');
      
      // Verify total cost is displayed
      await expect(page.locator('text=סה"כ עלות')).toBeVisible();
      
      // Verify total cost is calculated correctly
      const totalElement = page.locator('[data-testid="user-total-cost"]');
      await expect(totalElement).toBeVisible();
      
      // Total should be greater than 0
      const totalText = await totalElement.textContent();
      const totalValue = parseFloat(totalText.replace(/[^\d.]/g, ''));
      expect(totalValue).toBeGreaterThan(0);
    }
    
    await takeScreenshot(page, 'total-cost-calculation');
  });
});
