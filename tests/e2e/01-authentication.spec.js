/**
 * Test Case 1: User Authentication Flow
 * Tests: Login, Logout, Profile Setup, Blocked User Handling
 */

const { test, expect } = require('@playwright/test');
const { 
  mockGoogleAuth, 
  createTestUser, 
  waitForAuth, 
  waitForLoading,
  navigateToPage,
  waitForToast,
  takeScreenshot
} = require('./test-helpers');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPage(page, '/login');
  });

  test('1.1 - User can login with Google successfully', async ({ page }) => {
    // Mock successful Google authentication
    const testUser = createTestUser({
      email: 'test@example.com',
      displayName: 'Test User',
      phoneNumber: '0501234567'
    });

    await mockGoogleAuth(page, testUser);

    // Click login button
    await page.click('h2:has-text("התחבר עם גוגל")');
    
    // Wait for redirect to home page
    await page.waitForURL('/');
    
    // Verify user is logged in
    await expect(page.locator('text=Test User')).toBeVisible();
    
    // Take screenshot for verification
    await takeScreenshot(page, 'login-success');
  });

  test('1.2 - New user is prompted to complete profile', async ({ page }) => {
    // Mock new user without profile
    const newUser = createTestUser({
      email: 'newuser@example.com',
      displayName: null,
      phoneNumber: null
    });

    await mockGoogleAuth(page, newUser);

    // Click login button
    await page.click('h2:has-text("התחבר עם גוגל")');
    
    // Wait for profile prompt modal
    await page.waitForSelector('[data-testid="name-prompt"]', { timeout: 10000 });
    
    // Verify profile form is visible
    await expect(page.locator('input[placeholder*="שם"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="טלפון"]')).toBeVisible();
    
    // Fill profile form
    await page.fill('input[placeholder*="שם"]', 'New User');
    await page.fill('input[placeholder*="טלפון"]', '0501234567');
    
    // Submit profile
    await page.click('button:has-text("שמור")');
    
    // Wait for redirect to home
    await page.waitForURL('/');
    
    // Verify profile is complete
    await expect(page.locator('text=New User')).toBeVisible();
    
    await takeScreenshot(page, 'profile-completion');
  });

  test('1.3 - Blocked user cannot login', async ({ page }) => {
    // Mock blocked user
    const blockedUser = createTestUser({
      email: 'blocked@example.com',
      isBlocked: true
    });

    await mockGoogleAuth(page, blockedUser);

    // Click login button
    await page.click('h2:has-text("התחבר עם גוגל")');
    
    // Wait for blocked modal
    await page.waitForSelector('[data-testid="blocked-modal"]', { timeout: 10000 });
    
    // Verify blocked message
    await expect(page.locator('text=החשבון שלך חסום')).toBeVisible();
    await expect(page.locator('text=אנא פנה לטל')).toBeVisible();
    
    // Verify still on login page
    await expect(page).toHaveURL('/login');
    
    await takeScreenshot(page, 'blocked-user');
  });

  test('1.4 - User can logout successfully', async ({ page }) => {
    // First login
    const testUser = createTestUser();
    await mockGoogleAuth(page, testUser);
    
    await page.click('h2:has-text("התחבר עם גוגל")');
    await page.waitForURL('/');
    
    // Click logout
    await page.click('button:has-text("התנתק")');
    
    // Verify redirect to login
    await page.waitForURL('/login');
    
    // Verify login form is visible
    await expect(page.locator('h2:has-text("התחבר עם גוגל")')).toBeVisible();
    
    await takeScreenshot(page, 'logout-success');
  });

  test('1.5 - Invalid phone number validation', async ({ page }) => {
    // Mock new user
    const newUser = createTestUser({
      displayName: null,
      phoneNumber: null
    });

    await mockGoogleAuth(page, newUser);

    await page.click('h2:has-text("התחבר עם גוגל")');
    await page.waitForSelector('[data-testid="name-prompt"]');
    
    // Fill with invalid phone
    await page.fill('input[placeholder*="שם"]', 'Test User');
    await page.fill('input[placeholder*="טלפון"]', '123456');
    
    await page.click('button:has-text("שמור")');
    
    // Verify validation error
    await expect(page.locator('text=Please enter a valid Israeli phone number')).toBeVisible();
    
    // Verify still on profile form
    await expect(page.locator('[data-testid="name-prompt"]')).toBeVisible();
    
    await takeScreenshot(page, 'invalid-phone-validation');
  });
});
