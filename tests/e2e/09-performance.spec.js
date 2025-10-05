/**
 * Test Case 9: Performance and Load Testing
 * Tests: Page load times, Memory usage, Large data sets, Performance metrics
 */

const { test, expect } = require('@playwright/test');
const { 
  mockGoogleAuth, 
  createTestUser, 
  waitForLoading,
  navigateToPage,
  takeScreenshot
} = require('./test-helpers');

test.describe('Performance and Load Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    const testUser = createTestUser({
      name: 'Test User',
      phone: '0501234567'
    });
    
    await mockGoogleAuth(page, testUser);
  });

  test('9.1 - Home page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await navigateToPage(page, '/');
    
    // Wait for main content to be visible
    await page.waitForSelector('[data-testid="breads-list"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Home page load time: ${loadTime}ms`);
    
    await takeScreenshot(page, 'performance-home-load');
  });

  test('9.2 - Admin page handles large datasets efficiently', async ({ page }) => {
    // Mock admin user
    const adminUser = createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true
    });
    
    await mockGoogleAuth(page, adminUser);
    
    const startTime = Date.now();
    
    await navigateToPage(page, '/admin');
    
    // Wait for admin dashboard to load
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Admin page should load within 8 seconds
    expect(loadTime).toBeLessThan(8000);
    
    console.log(`Admin page load time: ${loadTime}ms`);
    
    await takeScreenshot(page, 'performance-admin-load');
  });

  test('9.3 - Memory usage remains stable during navigation', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Navigate through multiple pages
    await navigateToPage(page, '/');
    await page.waitForSelector('[data-testid="breads-list"]');
    
    await navigateToPage(page, '/orders');
    await page.waitForSelector('[data-testid="orders-page"]');
    
    // Navigate back to home
    await navigateToPage(page, '/');
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Check memory usage after navigation
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Memory usage should not increase significantly (allow 50% increase)
    const memoryIncrease = finalMemory - initialMemory;
    const maxAllowedIncrease = initialMemory * 0.5;
    
    expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);
    
    console.log(`Memory increase: ${memoryIncrease} bytes`);
    
    await takeScreenshot(page, 'performance-memory-usage');
  });

  test('9.4 - Large order lists render efficiently', async ({ page }) => {
    // Mock admin user to access order history
    const adminUser = createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true
    });
    
    await mockGoogleAuth(page, adminUser);
    
    const startTime = Date.now();
    
    await navigateToPage(page, '/order-history');
    
    // Wait for order history table to load
    await page.waitForSelector('[data-testid="order-history-table"]', { timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    
    // Order history should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
    
    // Check if table is scrollable (indicates virtualization or pagination)
    const tableContainer = page.locator('[data-testid="order-history-table"]');
    const isScrollable = await tableContainer.evaluate(el => {
      return el.scrollHeight > el.clientHeight;
    });
    
    // Table should handle large datasets efficiently
    expect(isScrollable).toBeTruthy();
    
    console.log(`Order history load time: ${loadTime}ms`);
    
    await takeScreenshot(page, 'performance-large-dataset');
  });

  test('9.5 - Network requests are optimized', async ({ page }) => {
    const requests = [];
    
    // Track network requests
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });
    
    await navigateToPage(page, '/');
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Analyze network requests
    const firebaseRequests = requests.filter(req => 
      req.url.includes('firestore.googleapis.com')
    );
    
    // Should not have excessive Firebase requests
    expect(firebaseRequests.length).toBeLessThan(10);
    
    // Check for duplicate requests
    const uniqueUrls = new Set(firebaseRequests.map(req => req.url));
    expect(uniqueUrls.size).toBe(firebaseRequests.length);
    
    console.log(`Total Firebase requests: ${firebaseRequests.length}`);
    
    await takeScreenshot(page, 'performance-network-optimization');
  });
});
