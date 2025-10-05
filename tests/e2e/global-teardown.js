/**
 * Global teardown for E2E tests
 * Runs once after all tests complete
 */

const { completeCleanup } = require('./database-cleanup');

async function globalTeardown(config) {
  console.log('🏁 E2E test suite completed, starting cleanup...');
  
  try {
    // Clean up all test data after tests complete
    console.log('🧹 Cleaning up all test data...');
    await completeCleanup();
    
    console.log('✅ Global teardown completed successfully');
    console.log('🎉 All database changes have been reverted');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here to avoid masking test results
    console.error('⚠️  Manual cleanup may be required');
  }
}

module.exports = globalTeardown;
