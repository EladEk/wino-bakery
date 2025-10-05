/**
 * Global setup for E2E tests
 * Runs once before all tests start
 */

const { completeCleanup } = require('./database-cleanup');

async function globalSetup(config) {
  console.log('🚀 Starting E2E test suite...');
  
  try {
    // Clean up any existing test data before starting
    console.log('🧹 Cleaning up existing test data...');
    await completeCleanup();
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

module.exports = globalSetup;
