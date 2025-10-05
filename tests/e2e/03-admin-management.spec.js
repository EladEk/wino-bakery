/**
 * Test Case 3: Admin Management Flow
 * Tests: Admin login, Bread management, User management, Sale configuration
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

test.describe('Admin Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin user
    const adminUser = createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true
    });
    
    await mockGoogleAuth(page, adminUser);
    await navigateToPage(page, '/admin');
  });

  test('3.1 - Admin can access admin dashboard', async ({ page }) => {
    // Verify admin dashboard is accessible
    await expect(page.locator('h2:has-text("פאנל ניהול")')).toBeVisible();
    
    // Verify admin navigation is present
    await expect(page.locator('text=ניהול משתמשים')).toBeVisible();
    await expect(page.locator('text=היסטוריית הזמנות')).toBeVisible();
    
    // Verify admin controls are visible
    await expect(page.locator('button:has-text("הוסף לחם")')).toBeVisible();
    await expect(page.locator('button:has-text("סיום מכירה")')).toBeVisible();
    
    await takeScreenshot(page, 'admin-dashboard');
  });

  test('3.2 - Admin can add new bread', async ({ page }) => {
    // Click add bread button
    await page.click('button:has-text("הוסף לחם")');
    
    // Wait for modal to open
    await page.waitForSelector('[data-testid="add-bread-modal"]');
    
    // Fill bread form
    await fillFormField(page, 'input[placeholder*="שם"]', 'Test Admin Bread');
    await fillFormField(page, 'input[type="number"][min="1"]', '20');
    await fillFormField(page, 'textarea', 'A delicious test bread created by admin');
    await fillFormField(page, 'input[type="number"][min="0"]', '18.50');
    
    // Check show checkbox
    await page.check('input[type="checkbox"]');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success
    await waitForToast(page, 'Bread added successfully!');
    
    // Verify bread appears in list
    await expect(page.locator('text=Test Admin Bread')).toBeVisible();
    
    await takeScreenshot(page, 'admin-add-bread');
  });

  test('3.3 - Admin can edit existing bread', async ({ page }) => {
    // Wait for bread list to load
    await page.waitForSelector('[data-testid="bread-list"]');
    
    // Find first bread and click edit
    const firstBread = page.locator('[data-testid="bread-item"]').first();
    if (await firstBread.count() > 0) {
      await firstBread.locator('button:has-text("ערוך")').click();
      
      // Wait for edit modal
      await page.waitForSelector('[data-testid="edit-bread-modal"]');
      
      // Update bread name
      const nameInput = page.locator('input[value]').first();
      await nameInput.fill('Updated Test Bread');
      
      // Save changes
      await page.click('button:has-text("שמור")');
      
      // Wait for success
      await waitForToast(page, 'Bread updated successfully!');
      
      // Verify updated name appears
      await expect(page.locator('text=Updated Test Bread')).toBeVisible();
    }
    
    await takeScreenshot(page, 'admin-edit-bread');
  });

  test('3.4 - Admin can manage sale configuration', async ({ page }) => {
    // Find sale configuration section
    await page.waitForSelector('[data-testid="sale-config"]');
    
    // Update sale date
    await fillFormField(page, 'input[type="date"]', '2024-12-25');
    
    // Update start hour
    await fillFormField(page, 'input[type="time"]', '09:00');
    
    // Update end hour
    await fillFormField(page, 'input[type="time"]', '17:00');
    
    // Update pickup address
    await fillFormField(page, 'input[placeholder*="כתובת"]', 'Test Address 123, Tel Aviv');
    
    // Update bit number
    await fillFormField(page, 'input[placeholder*="מספר ביט"]', '123456789');
    
    // Save configuration
    await page.click('button:has-text("שמור")');
    
    // Wait for success
    await waitForToast(page, 'עודכן');
    
    await takeScreenshot(page, 'admin-sale-config');
  });

  test('3.5 - Admin can end sale and archive orders', async ({ page }) => {
    // Click end sale button
    await page.click('button:has-text("סיום מכירה")');
    
    // Wait for confirmation modal
    await page.waitForSelector('[data-testid="end-sale-modal"]');
    
    // Confirm end sale
    await page.click('button:has-text("כן, סיים מכירה")');
    
    // Wait for success
    await waitForToast(page, 'המכירה הסתיימה בהצלחה');
    
    // Verify orders are archived and bread inventory is reset
    await expect(page.locator('text=סה"כ הכנסות: 0.00')).toBeVisible();
    
    await takeScreenshot(page, 'admin-end-sale');
  });
});
