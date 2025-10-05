/**
 * Test Case 8: Error Handling and Edge Cases
 * Tests: Network errors, Invalid inputs, Edge cases, Error recovery
 */

const { test, expect } = require('@playwright/test');
const { 
  mockGoogleAuth, 
  createTestUser, 
  waitForLoading,
  navigateToPage,
  takeScreenshot,
  waitForToast
} = require('./test-helpers');

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    const testUser = createTestUser({
      name: 'Test User',
      phone: '0501234567'
    });
    
    await mockGoogleAuth(page, testUser);
  });

  test('8.1 - Handles network connectivity issues gracefully', async ({ page }) => {
    // Simulate network offline
    await page.context().setOffline(true);
    
    await navigateToPage(page, '/');
    
    // Should show loading state or error message
    const loadingElement = page.locator('[data-testid="loading"]');
    const errorElement = page.locator('[data-testid="error"]');
    
    // Either loading or error should be visible
    const hasLoading = await loadingElement.count() > 0;
    const hasError = await errorElement.count() > 0;
    
    expect(hasLoading || hasError).toBeTruthy();
    
    // Restore network
    await page.context().setOffline(false);
    
    await takeScreenshot(page, 'network-offline-handling');
  });

  test('8.2 - Validates form inputs correctly', async ({ page }) => {
    // Mock admin user for form testing
    const adminUser = createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true
    });
    
    await mockGoogleAuth(page, adminUser);
    await navigateToPage(page, '/admin');
    
    // Test add bread form validation
    await page.click('button:has-text("הוסף לחם")');
    await page.waitForSelector('[data-testid="add-bread-modal"]');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    
    // Test invalid price
    await page.fill('input[placeholder*="שם"]', 'Test Bread');
    await page.fill('input[type="number"][min="0"]', '-10');
    await page.click('button[type="submit"]');
    
    // Should show price validation error
    await expect(page.locator('text=Price must be a positive number')).toBeVisible();
    
    await takeScreenshot(page, 'form-validation');
  });

  test('8.3 - Handles insufficient inventory gracefully', async ({ page }) => {
    await navigateToPage(page, '/');
    
    // Wait for breads to load
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Try to order more than available
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    if (await firstBread.count() > 0) {
      // Get available quantity
      const availableText = await firstBread.locator('[data-testid="bread-available"]').textContent();
      const available = parseInt(availableText.match(/\d+/)[0]);
      
      // Try to order more than available
      await firstBread.locator('input[type="number"]').fill((available + 10).toString());
      await page.click('button:has-text("הזמן")');
      
      // Should show error message
      await waitForToast(page, 'Not enough bread available');
    }
    
    await takeScreenshot(page, 'insufficient-inventory');
  });

  test('8.4 - Handles concurrent order conflicts', async ({ page, context }) => {
    // Create two browser contexts to simulate concurrent users
    const page2 = await context.newPage();
    
    // Set up both pages with different users
    const user1 = createTestUser({ name: 'User 1', email: 'user1@test.com' });
    const user2 = createTestUser({ name: 'User 2', email: 'user2@test.com' });
    
    await mockGoogleAuth(page, user1);
    await mockGoogleAuth(page2, user2);
    
    // Navigate both to home page
    await navigateToPage(page, '/');
    await navigateToPage(page2, '/');
    
    // Wait for breads to load on both pages
    await page.waitForSelector('[data-testid="breads-list"]');
    await page2.waitForSelector('[data-testid="breads-list"]');
    
    // Both users try to order the same bread simultaneously
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    const firstBread2 = page2.locator('[data-testid="bread-item"]').first();
    
    if (await firstBread.count() > 0 && await firstBread2.count() > 0) {
      // Both users order 1 piece
      await firstBread.locator('input[type="number"]').fill('1');
      await firstBread2.locator('input[type="number"]').fill('1');
      
      // Click order on both pages simultaneously
      await Promise.all([
        page.click('button:has-text("הזמן")'),
        page2.click('button:has-text("הזמן")')
      ]);
      
      // At least one should succeed, one might get an error
      await page.waitForTimeout(2000);
      
      // Check for success or error messages
      const hasSuccess1 = await page.locator('text=תודה על ההזמנה!').count() > 0;
      const hasSuccess2 = await page2.locator('text=תודה על ההזמנה!').count() > 0;
      
      expect(hasSuccess1 || hasSuccess2).toBeTruthy();
    }
    
    await page2.close();
    await takeScreenshot(page, 'concurrent-orders');
  });

  test('8.5 - Recovers from Firebase errors gracefully', async ({ page }) => {
    // Mock Firebase error
    await page.addInitScript(() => {
      // Override Firebase functions to simulate errors
      const originalOnSnapshot = window.firebase?.firestore?.onSnapshot;
      if (originalOnSnapshot) {
        window.firebase.firestore.onSnapshot = () => {
          throw new Error('Firebase connection error');
        };
      }
    });
    
    await navigateToPage(page, '/');
    
    // Should show error state or fallback UI
    const errorElement = page.locator('[data-testid="error"]');
    const fallbackElement = page.locator('[data-testid="fallback"]');
    
    // Either error or fallback should be visible
    const hasError = await errorElement.count() > 0;
    const hasFallback = await fallbackElement.count() > 0;
    
    expect(hasError || hasFallback).toBeTruthy();
    
    await takeScreenshot(page, 'firebase-error-recovery');
  });
});
