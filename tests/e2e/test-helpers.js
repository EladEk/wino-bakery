/**
 * Test helper functions for Bread Bakery E2E tests
 */

/**
 * Wait for Firebase authentication to complete
 * @param {import('@playwright/test').Page} page
 */
async function waitForAuth(page) {
  // Wait for auth state to be determined
  await page.waitForFunction(() => {
    return window.firebase && window.firebase.auth && window.firebase.auth().currentUser !== undefined;
  }, { timeout: 10000 });
}

/**
 * Mock Google authentication for testing
 * @param {import('@playwright/test').Page} page
 * @param {Object} user - Mock user object
 */
async function mockGoogleAuth(page, user = {}) {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    phoneNumber: '0501234567',
    ...user
  };

  await page.addInitScript((user) => {
    // Mock Firebase auth
    window.mockFirebaseAuth = {
      signInWithPopup: () => Promise.resolve({
        user: user
      }),
      signOut: () => Promise.resolve(),
      onAuthStateChanged: (callback) => {
        // Simulate auth state change
        setTimeout(() => callback(user), 100);
        return () => {}; // unsubscribe function
      }
    };
  }, mockUser);
}

/**
 * Create test bread data
 * @param {Object} overrides - Override default bread data
 */
function createTestBread(overrides = {}) {
  const { markTestData } = require('./database-cleanup');
  return markTestData('E2E_TEST', {
    name: 'Test Bread',
    description: 'A delicious test bread',
    availablePieces: 10,
    price: 15.50,
    show: true,
    isFocaccia: false,
    claimedBy: [],
    ...overrides
  });
}

/**
 * Create test user data
 * @param {Object} overrides - Override default user data
 */
function createTestUser(overrides = {}) {
  const { markTestData } = require('./database-cleanup');
  return markTestData('E2E_TEST', {
    uid: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    phone: '0501234567',
    isAdmin: false,
    isBlocked: false,
    ...overrides
  });
}

/**
 * Wait for element to be visible and stable
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {number} timeout
 */
async function waitForStableElement(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  // Wait a bit more for any animations to complete
  await page.waitForTimeout(500);
}

/**
 * Fill form field with validation
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} value
 */
async function fillFormField(page, selector, value) {
  await page.waitForSelector(selector);
  await page.fill(selector, value);
  // Trigger validation
  await page.blur(selector);
  await page.waitForTimeout(100);
}

/**
 * Click button and wait for response
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {number} timeout
 */
async function clickAndWait(page, selector, timeout = 5000) {
  await page.waitForSelector(selector);
  await page.click(selector);
  // Wait for any async operations
  await page.waitForTimeout(1000);
}

/**
 * Wait for toast notification
 * @param {import('@playwright/test').Page} page
 * @param {string} message - Expected toast message
 * @param {number} timeout
 */
async function waitForToast(page, message, timeout = 5000) {
  await page.waitForSelector('.toast-container', { timeout });
  await page.waitForSelector(`text=${message}`, { timeout });
}

/**
 * Wait for loading to complete
 * @param {import('@playwright/test').Page} page
 */
async function waitForLoading(page) {
  // Wait for loading indicators to disappear
  await page.waitForFunction(() => {
    const loaders = document.querySelectorAll('.loading, .spinner, [data-testid="loading"]');
    return loaders.length === 0;
  }, { timeout: 10000 });
}

/**
 * Navigate to page and wait for it to load
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 */
async function navigateToPage(page, path) {
  await page.goto(path);
  await waitForLoading(page);
}

/**
 * Check if element exists without throwing
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function elementExists(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get text content safely
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function getTextContent(page, selector) {
  try {
    const element = await page.waitForSelector(selector, { timeout: 5000 });
    return await element.textContent();
  } catch {
    return null;
  }
}

/**
 * Wait for network to be idle
 * @param {import('@playwright/test').Page} page
 */
async function waitForNetworkIdle(page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Take screenshot with timestamp
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

module.exports = {
  waitForAuth,
  mockGoogleAuth,
  createTestBread,
  createTestUser,
  waitForStableElement,
  fillFormField,
  clickAndWait,
  waitForToast,
  waitForLoading,
  navigateToPage,
  elementExists,
  getTextContent,
  waitForNetworkIdle,
  takeScreenshot
};
