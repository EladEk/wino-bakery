/**
 * Test Case 7: Internationalization (i18n)
 * Tests: Language switching, RTL/LTR support, Translation accuracy
 */

const { test, expect } = require('@playwright/test');
const { 
  mockGoogleAuth, 
  createTestUser, 
  waitForLoading,
  navigateToPage,
  takeScreenshot
} = require('./test-helpers');

test.describe('Internationalization (i18n)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    const testUser = createTestUser({
      name: 'Test User',
      phone: '0501234567'
    });
    
    await mockGoogleAuth(page, testUser);
  });

  test('7.1 - Hebrew (RTL) interface displays correctly', async ({ page }) => {
    // Set Hebrew language
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'he');
    });
    
    await navigateToPage(page, '/');
    
    // Verify RTL direction is set
    const htmlElement = await page.locator('html');
    await expect(htmlElement).toHaveAttribute('dir', 'rtl');
    
    // Verify Hebrew text is displayed
    await expect(page.locator('h2:has-text("לחמים להזמנה")')).toBeVisible();
    await expect(page.locator('button:has-text("הזמן")')).toBeVisible();
    
    // Verify RTL layout
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    if (await firstBread.count() > 0) {
      const boundingBox = await firstBread.boundingBox();
      // In RTL, content should be right-aligned
      expect(boundingBox.x).toBeGreaterThan(100);
    }
    
    await takeScreenshot(page, 'hebrew-rtl-interface');
  });

  test('7.2 - English (LTR) interface displays correctly', async ({ page }) => {
    // Set English language
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'en');
    });
    
    await navigateToPage(page, '/');
    
    // Verify LTR direction is set
    const htmlElement = await page.locator('html');
    await expect(htmlElement).toHaveAttribute('dir', 'ltr');
    
    // Verify English text is displayed
    await expect(page.locator('h2:has-text("Breads to order")')).toBeVisible();
    await expect(page.locator('button:has-text("Order")')).toBeVisible();
    
    // Verify LTR layout
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    if (await firstBread.count() > 0) {
      const boundingBox = await firstBread.boundingBox();
      // In LTR, content should be left-aligned
      expect(boundingBox.x).toBeLessThan(200);
    }
    
    await takeScreenshot(page, 'english-ltr-interface');
  });

  test('7.3 - Language switching works dynamically', async ({ page }) => {
    // Start with Hebrew
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'he');
    });
    
    await navigateToPage(page, '/');
    
    // Verify Hebrew is active
    await expect(page.locator('h2:has-text("לחמים להזמנה")')).toBeVisible();
    
    // Switch to English
    await page.evaluate(() => {
      window.i18next.changeLanguage('en');
    });
    
    // Wait for language change
    await page.waitForTimeout(1000);
    
    // Verify English is now active
    await expect(page.locator('h2:has-text("Breads to order")')).toBeVisible();
    
    // Verify direction changed to LTR
    const htmlElement = await page.locator('html');
    await expect(htmlElement).toHaveAttribute('dir', 'ltr');
    
    await takeScreenshot(page, 'language-switching');
  });

  test('7.4 - Date formatting respects locale', async ({ page }) => {
    // Set Hebrew language
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'he');
    });
    
    await navigateToPage(page, '/');
    
    // Check if sale date is displayed in Hebrew format
    const saleDateElement = page.locator('[data-testid="sale-date"]');
    if (await saleDateElement.count() > 0) {
      const dateText = await saleDateElement.textContent();
      // Hebrew dates should contain Hebrew day names
      expect(dateText).toMatch(/יום/);
    }
    
    await takeScreenshot(page, 'hebrew-date-formatting');
  });

  test('7.5 - Number formatting respects locale', async ({ page }) => {
    // Set Hebrew language
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'he');
    });
    
    await navigateToPage(page, '/');
    
    // Wait for breads to load
    await page.waitForSelector('[data-testid="breads-list"]');
    
    // Check price formatting
    const priceElements = page.locator('[data-testid="bread-price"]');
    if (await priceElements.count() > 0) {
      const priceText = await priceElements.first().textContent();
      // Hebrew locale should format numbers appropriately
      expect(priceText).toMatch(/\d+/);
    }
    
    await takeScreenshot(page, 'hebrew-number-formatting');
  });
});
