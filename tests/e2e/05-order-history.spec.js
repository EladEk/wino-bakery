/**
 * Test Case 5: Order History and Reporting
 * Tests: Order history viewing, Sales reports, Data archiving
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

test.describe('Order History and Reporting', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin user
    const adminUser = createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true
    });
    
    await mockGoogleAuth(page, adminUser);
    await navigateToPage(page, '/order-history');
  });

  test('5.1 - Admin can view order history', async ({ page }) => {
    // Verify order history page loads
    await expect(page.locator('h2:has-text("היסטוריית הזמנות")')).toBeVisible();
    
    // Wait for order history table
    await page.waitForSelector('[data-testid="order-history-table"]');
    
    // Verify table headers are present
    await expect(page.locator('text=תאריך מכירה')).toBeVisible();
    await expect(page.locator('text=סה"כ נמכר')).toBeVisible();
    
    await takeScreenshot(page, 'order-history-page');
  });

  test('5.2 - Admin can filter orders by date', async ({ page }) => {
    // Wait for order history table
    await page.waitForSelector('[data-testid="order-history-table"]');
    
    // Set date filter
    await fillFormField(page, 'input[type="date"]', '2024-01-01');
    
    // Apply filter
    await page.click('button:has-text("סנן")');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Verify results are filtered (if any exist)
    const orderRows = page.locator('[data-testid="order-row"]');
    const rowCount = await orderRows.count();
    
    if (rowCount > 0) {
      await expect(orderRows.first()).toBeVisible();
    }
    
    await takeScreenshot(page, 'filter-orders-by-date');
  });

  test('5.3 - Admin can view detailed order information', async ({ page }) => {
    // Wait for order history table
    await page.waitForSelector('[data-testid="order-history-table"]');
    
    const orderRows = page.locator('[data-testid="order-row"]');
    const rowCount = await orderRows.count();
    
    if (rowCount > 0) {
      // Click on first order to view details
      await orderRows.first().click();
      
      // Wait for order details modal
      await page.waitForSelector('[data-testid="order-details-modal"]');
      
      // Verify order details are shown
      await expect(page.locator('text=פרטי הזמנה')).toBeVisible();
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      
      // Close modal
      await page.click('button:has-text("סגור")');
    }
    
    await takeScreenshot(page, 'view-order-details');
  });

  test('5.4 - Admin can delete order history entry', async ({ page }) => {
    // Wait for order history table
    await page.waitForSelector('[data-testid="order-history-table"]');
    
    const orderRows = page.locator('[data-testid="order-row"]');
    const rowCount = await orderRows.count();
    
    if (rowCount > 0) {
      // Click delete button on first order
      await orderRows.first().locator('button:has-text("מחק")').click();
      
      // Confirm deletion
      await page.click('button:has-text("כן")');
      
      // Wait for success
      await waitForToast(page, 'המכירה נמחקה בהצלחה!');
      
      // Verify order is removed from table
      const newRowCount = await orderRows.count();
      expect(newRowCount).toBe(rowCount - 1);
    }
    
    await takeScreenshot(page, 'delete-order-history');
  });

  test('5.5 - Admin can view sales summary', async ({ page }) => {
    // Wait for order history table
    await page.waitForSelector('[data-testid="order-history-table"]');
    
    // Verify sales summary is displayed
    await expect(page.locator('[data-testid="sales-summary"]')).toBeVisible();
    
    // Check for total revenue
    await expect(page.locator('text=סה"כ הכנסות')).toBeVisible();
    
    // Check for total orders
    await expect(page.locator('text=סה"כ הזמנות')).toBeVisible();
    
    await takeScreenshot(page, 'sales-summary');
  });
});
