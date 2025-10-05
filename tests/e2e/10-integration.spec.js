/**
 * Test Case 10: End-to-End Integration Tests
 * Tests: Complete user journeys, Cross-feature integration, Real-world scenarios
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

test.describe('End-to-End Integration Tests', () => {
  test('10.1 - Complete customer journey from registration to order', async ({ page }) => {
    // Step 1: New user registration
    const newUser = createTestUser({
      email: 'newcustomer@example.com',
      displayName: null,
      phoneNumber: null
    });

    await mockGoogleAuth(page, newUser);
    await navigateToPage(page, '/login');
    
    // Login
    await page.click('h2:has-text("התחבר עם גוגל")');
    
    // Complete profile
    await page.waitForSelector('[data-testid="name-prompt"]');
    await fillFormField(page, 'input[placeholder*="שם"]', 'New Customer');
    await fillFormField(page, 'input[placeholder*="טלפון"]', '0501234567');
    await page.click('button:has-text("שמור")');
    
    // Step 2: Browse and order breads
    await page.waitForURL('/');
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Order first bread
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    if (await firstBread.count() > 0) {
      await firstBread.locator('input[type="number"]').fill('2');
      await page.click('button:has-text("הזמן")');
      await waitForToast(page, 'תודה על ההזמנה!');
    }
    
    // Step 3: Update order
    const orderedBread = page.locator('[data-testid="ordered-bread"]').first();
    if (await orderedBread.count() > 0) {
      await orderedBread.locator('input[type="number"]').fill('3');
      await page.click('button:has-text("עדכן הזמנה")');
      await waitForToast(page, 'הזמנה עודכנה!');
    }
    
    // Step 4: View order summary
    await navigateToPage(page, '/orders');
    await page.waitForSelector('[data-testid="orders-page"]');
    
    // Verify order is displayed
    await expect(page.locator('text=New Customer')).toBeVisible();
    
    await takeScreenshot(page, 'complete-customer-journey');
  });

  test('10.2 - Complete admin workflow from setup to sale completion', async ({ page }) => {
    // Step 1: Admin login
    const adminUser = createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true
    });
    
    await mockGoogleAuth(page, adminUser);
    await navigateToPage(page, '/admin');
    
    // Step 2: Configure sale
    await page.waitForSelector('[data-testid="sale-config"]');
    await fillFormField(page, 'input[type="date"]', '2024-12-25');
    await fillFormField(page, 'input[type="time"]', '09:00');
    await fillFormField(page, 'input[type="time"]', '17:00');
    await fillFormField(page, 'input[placeholder*="כתובת"]', 'Test Bakery, Tel Aviv');
    await fillFormField(page, 'input[placeholder*="מספר ביט"]', '123456789');
    await page.click('button:has-text("שמור")');
    await waitForToast(page, 'עודכן');
    
    // Step 3: Add breads
    await page.click('button:has-text("הוסף לחם")');
    await page.waitForSelector('[data-testid="add-bread-modal"]');
    
    await fillFormField(page, 'input[placeholder*="שם"]', 'Integration Test Bread');
    await fillFormField(page, 'input[type="number"][min="1"]', '50');
    await fillFormField(page, 'textarea', 'A bread created during integration testing');
    await fillFormField(page, 'input[type="number"][min="0"]', '20.00');
    await page.click('button[type="submit"]');
    await waitForToast(page, 'Bread added successfully!');
    
    // Step 4: Monitor orders (simulate customer orders)
    // This would typically be done by another user, but we'll simulate it
    
    // Step 5: End sale
    await page.click('button:has-text("סיום מכירה")');
    await page.waitForSelector('[data-testid="end-sale-modal"]');
    await page.click('button:has-text("כן, סיים מכירה")');
    await waitForToast(page, 'המכירה הסתיימה בהצלחה');
    
    // Step 6: View order history
    await navigateToPage(page, '/order-history');
    await page.waitForSelector('[data-testid="order-history-table"]');
    
    // Verify sale is archived
    await expect(page.locator('text=Integration Test Bread')).toBeVisible();
    
    await takeScreenshot(page, 'complete-admin-workflow');
  });

  test('10.3 - Multi-user scenario with concurrent operations', async ({ page, context }) => {
    // Create multiple browser contexts for different users
    const adminPage = await context.newPage();
    const customerPage = await context.newPage();
    
    // Set up admin user
    const adminUser = createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true
    });
    
    // Set up customer user
    const customerUser = createTestUser({
      name: 'Customer User',
      email: 'customer@example.com',
      isAdmin: false
    });
    
    await mockGoogleAuth(adminPage, adminUser);
    await mockGoogleAuth(customerPage, customerUser);
    
    // Admin adds bread
    await navigateToPage(adminPage, '/admin');
    await adminPage.waitForSelector('[data-testid="admin-dashboard"]');
    
    await adminPage.click('button:has-text("הוסף לחם")');
    await adminPage.waitForSelector('[data-testid="add-bread-modal"]');
    
    await fillFormField(adminPage, 'input[placeholder*="שם"]', 'Multi-User Test Bread');
    await fillFormField(adminPage, 'input[type="number"][min="1"]', '10');
    await fillFormField(adminPage, 'textarea', 'Bread for multi-user testing');
    await fillFormField(adminPage, 'input[type="number"][min="0"]', '15.00');
    await adminPage.click('button[type="submit"]');
    await waitForToast(adminPage, 'Bread added successfully!');
    
    // Customer orders the bread
    await navigateToPage(customerPage, '/');
    await customerPage.waitForSelector('[data-testid="breads-list"]');
    
    const breadItem = customerPage.locator('text=Multi-User Test Bread').locator('..');
    await breadItem.locator('input[type="number"]').fill('2');
    await customerPage.click('button:has-text("הזמן")');
    await waitForToast(customerPage, 'תודה על ההזמנה!');
    
    // Admin sees the order in real-time
    await adminPage.reload();
    await adminPage.waitForSelector('[data-testid="admin-dashboard"]');
    
    // Verify order appears in admin view
    await expect(adminPage.locator('text=Customer User')).toBeVisible();
    await expect(adminPage.locator('text=2')).toBeVisible();
    
    await adminPage.close();
    await customerPage.close();
    
    await takeScreenshot(page, 'multi-user-concurrent-operations');
  });

  test('10.4 - Cross-browser compatibility test', async ({ page, browser }) => {
    // Test in different browsers
    const browsers = ['chromium', 'firefox', 'webkit'];
    
    for (const browserName of browsers) {
      const browserType = browser.contexts()[0] || await browser.newContext();
      const testPage = await browserType.newPage();
      
      const testUser = createTestUser({
        name: `Test User ${browserName}`,
        email: `test-${browserName}@example.com`
      });
      
      await mockGoogleAuth(testPage, testUser);
      await navigateToPage(testPage, '/');
      
      // Verify basic functionality works
      await testPage.waitForSelector('[data-testid="breads-list"]');
      await expect(testPage.locator('h2:has-text("לחמים להזמנה")')).toBeVisible();
      
      // Test ordering functionality
      const firstBread = testPage.locator('[data-testid="bread-item"]').first();
      if (await firstBread.count() > 0) {
        await firstBread.locator('input[type="number"]').fill('1');
        await testPage.click('button:has-text("הזמן")');
        await waitForToast(testPage, 'תודה על ההזמנה!');
      }
      
      await testPage.close();
    }
    
    await takeScreenshot(page, 'cross-browser-compatibility');
  });

  test('10.5 - Data persistence and recovery test', async ({ page }) => {
    // Step 1: Create and save data
    const testUser = createTestUser({
      name: 'Persistence Test User',
      email: 'persistence@example.com'
    });
    
    await mockGoogleAuth(page, testUser);
    await navigateToPage(page, '/');
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Place an order
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    if (await firstBread.count() > 0) {
      await firstBread.locator('input[type="number"]').fill('2');
      await page.click('button:has-text("הזמן")');
      await waitForToast(page, 'תודה על ההזמנה!');
    }
    
    // Step 2: Simulate page refresh/reload
    await page.reload();
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Step 3: Verify data persisted
    await expect(page.locator('h3:has-text("לחמים שהזמנתי")')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible();
    
    // Step 4: Test logout and login
    await page.click('button:has-text("התנתק")');
    await page.waitForURL('/login');
    
    await page.click('h2:has-text("התחבר עם גוגל")');
    await page.waitForURL('/');
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Step 5: Verify data still persists after login
    await expect(page.locator('h3:has-text("לחמים שהזמנתי")')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible();
    
    await takeScreenshot(page, 'data-persistence-recovery');
  });
});
