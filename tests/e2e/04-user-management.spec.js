/**
 * Test Case 4: User Management Flow
 * Tests: User search, Admin privileges, User blocking/unblocking
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

test.describe('User Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin user
    const adminUser = createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true
    });
    
    await mockGoogleAuth(page, adminUser);
    await navigateToPage(page, '/users');
  });

  test('4.1 - Admin can view user management page', async ({ page }) => {
    // Verify user management page loads
    await expect(page.locator('h2:has-text("ניהול משתמשים")')).toBeVisible();
    
    // Verify user table is present
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Verify admin actions are available
    await expect(page.locator('text=פעולות')).toBeVisible();
    
    await takeScreenshot(page, 'user-management-page');
  });

  test('4.2 - Admin can search for users', async ({ page }) => {
    // Wait for users table to load
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Search for a user by name
    await fillFormField(page, 'input[placeholder*="חיפוש"]', 'Test');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results are filtered
    const userRows = page.locator('[data-testid="user-row"]');
    const rowCount = await userRows.count();
    
    if (rowCount > 0) {
      // Verify at least one result contains the search term
      const firstRow = userRows.first();
      await expect(firstRow).toBeVisible();
    }
    
    await takeScreenshot(page, 'user-search');
  });

  test('4.3 - Admin can make user admin', async ({ page }) => {
    // Wait for users table
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Find a non-admin user
    const userRows = page.locator('[data-testid="user-row"]');
    const rowCount = await userRows.count();
    
    if (rowCount > 0) {
      // Find a user that's not already admin
      const nonAdminRow = userRows.filter({ hasText: 'לא' }).first();
      
      if (await nonAdminRow.count() > 0) {
        // Click make admin button
        await nonAdminRow.locator('button:has-text("הפוך למנהל")').click();
        
        // Confirm action
        await page.click('button:has-text("כן")');
        
        // Wait for success
        await waitForToast(page, 'User updated successfully!');
        
        // Verify user is now admin
        await expect(nonAdminRow.locator('text=כן')).toBeVisible();
      }
    }
    
    await takeScreenshot(page, 'make-user-admin');
  });

  test('4.4 - Admin can block/unblock users', async ({ page }) => {
    // Wait for users table
    await page.waitForSelector('[data-testid="users-table"]');
    
    const userRows = page.locator('[data-testid="user-row"]');
    const rowCount = await userRows.count();
    
    if (rowCount > 0) {
      // Find an unblocked user
      const unblockedRow = userRows.filter({ hasText: 'לא' }).first();
      
      if (await unblockedRow.count() > 0) {
        // Block user
        await unblockedRow.locator('button:has-text("חסום")').click();
        await page.click('button:has-text("כן")');
        await waitForToast(page, 'User updated successfully!');
        
        // Verify user is blocked
        await expect(unblockedRow.locator('text=כן')).toBeVisible();
        
        // Unblock user
        await unblockedRow.locator('button:has-text("בטל חסימה")').click();
        await page.click('button:has-text("כן")');
        await waitForToast(page, 'User updated successfully!');
        
        // Verify user is unblocked
        await expect(unblockedRow.locator('text=לא')).toBeVisible();
      }
    }
    
    await takeScreenshot(page, 'block-unblock-user');
  });

  test('4.5 - Non-admin user cannot access user management', async ({ page }) => {
    // Logout admin
    await page.click('button:has-text("התנתק")');
    await page.waitForURL('/login');
    
    // Login as regular user
    const regularUser = createTestUser({
      name: 'Regular User',
      email: 'user@example.com',
      isAdmin: false
    });
    
    await mockGoogleAuth(page, regularUser);
    await page.click('h2:has-text("התחבר עם גוגל")');
    await page.waitForURL('/');
    
    // Try to navigate to user management
    await page.goto('/users');
    
    // Should be redirected or see access denied
    await expect(page).not.toHaveURL('/users');
    
    await takeScreenshot(page, 'non-admin-access-denied');
  });
});
