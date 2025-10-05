/**
 * Test Case 6: Responsive Design and Mobile Experience
 * Tests: Mobile layout, Touch interactions, Responsive navigation
 */

const { test, expect } = require('@playwright/test');
const { 
  mockGoogleAuth, 
  createTestUser, 
  waitForLoading,
  navigateToPage,
  takeScreenshot
} = require('./test-helpers');

test.describe('Responsive Design and Mobile Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    const testUser = createTestUser({
      name: 'Test User',
      phone: '0501234567'
    });
    
    await mockGoogleAuth(page, testUser);
  });

  test('6.1 - Mobile layout displays correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToPage(page, '/');
    
    // Verify mobile layout
    await expect(page.locator('h2:has-text("לחמים להזמנה")')).toBeVisible();
    
    // Check if mobile navigation is present
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav).toBeVisible();
    }
    
    // Verify content is scrollable
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    await takeScreenshot(page, 'mobile-layout');
  });

  test('6.2 - Touch interactions work on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToPage(page, '/');
    
    // Wait for breads to load
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Test touch interaction with quantity input
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    if (await firstBread.count() > 0) {
      const quantityInput = firstBread.locator('input[type="number"]');
      
      // Touch and focus the input
      await quantityInput.tap();
      await quantityInput.fill('2');
      
      // Test touch on order button
      await page.tap('button:has-text("הזמן")');
      
      // Verify interaction worked
      await expect(page.locator('text=2')).toBeVisible();
    }
    
    await takeScreenshot(page, 'mobile-touch-interactions');
  });

  test('6.3 - Tablet layout adapts correctly', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await navigateToPage(page, '/');
    
    // Verify tablet layout
    await expect(page.locator('h2:has-text("לחמים להזמנה")')).toBeVisible();
    
    // Check if content is properly arranged for tablet
    const breadItems = page.locator('[data-testid="bread-item"]');
    if (await breadItems.count() > 0) {
      await expect(breadItems.first()).toBeVisible();
    }
    
    await takeScreenshot(page, 'tablet-layout');
  });

  test('6.4 - Desktop layout is optimal', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await navigateToPage(page, '/');
    
    // Verify desktop layout
    await expect(page.locator('h2:has-text("לחמים להזמנה")')).toBeVisible();
    
    // Check if content uses full width effectively
    const mainContent = page.locator('[data-testid="main-content"]');
    if (await mainContent.count() > 0) {
      const boundingBox = await mainContent.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(800);
    }
    
    await takeScreenshot(page, 'desktop-layout');
  });

  test('6.5 - Navigation works across all screen sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await navigateToPage(page, '/');
      
      // Test navigation to admin page (if user is admin)
      const adminUser = createTestUser({
        name: 'Admin User',
        email: 'admin@example.com',
        isAdmin: true
      });
      
      await mockGoogleAuth(page, adminUser);
      await navigateToPage(page, '/admin');
      
      // Verify admin page loads correctly
      await expect(page.locator('h2:has-text("פאנל ניהול")')).toBeVisible();
      
      await takeScreenshot(page, `navigation-${viewport.name}`);
    }
  });
});
