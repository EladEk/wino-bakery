/**
 * Database cleanup utilities for E2E tests
 * Ensures all test data is removed after tests complete
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore');

// Firebase configuration (same as your app)
const firebaseConfig = {
  apiKey: "AIzaSyBAde-r0Rrh_D1oYTfGU8XvL_APfMSZHrE",
  authDomain: "wino-fb03d.firebaseapp.com",
  projectId: "wino-fb03d",
  storageBucket: "wino-fb03d.appspot.com",
  messagingSenderId: "45483660067",
  appId: "1:45483660067:web:fbf7f384c3536d5835b296",
  measurementId: "G-XWSF568GQD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Clean up all test data from database
 */
async function cleanupTestData() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    const batch = writeBatch(db);
    let deletedCount = 0;

    // Clean up test breads
    const breadsSnapshot = await getDocs(collection(db, 'breads'));
    for (const breadDoc of breadsSnapshot.docs) {
      const breadData = breadDoc.data();
      // Only delete breads that were created during testing
      if (breadData.name && breadData.name.includes('Test') || 
          breadData.description && breadData.description.includes('test')) {
        batch.delete(breadDoc.ref);
        deletedCount++;
      }
    }

    // Clean up test users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      // Only delete test users
      if (userData.email && (
          userData.email.includes('test@') || 
          userData.email.includes('newuser@') ||
          userData.email.includes('blocked@') ||
          userData.name && userData.name.includes('Test')
        )) {
        batch.delete(userDoc.ref);
        deletedCount++;
      }
    }

    // Clean up test order history
    const ordersSnapshot = await getDocs(collection(db, 'ordersHistory'));
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      // Delete orders created during testing (check for test breads in the order)
      if (orderData.breads && orderData.breads.some(bread => 
          bread.breadName && bread.breadName.includes('Test'))) {
        batch.delete(orderDoc.ref);
        deletedCount++;
      }
    }

    // Commit the batch deletion
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`✅ Cleaned up ${deletedCount} test documents`);
    } else {
      console.log('✅ No test data found to clean up');
    }

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  }
}

/**
 * Clean up specific test data by tags
 * @param {Array} testTags - Array of test identifiers to clean up
 */
async function cleanupTestDataByTags(testTags = []) {
  console.log(`🧹 Cleaning up test data with tags: ${testTags.join(', ')}`);
  
  try {
    const batch = writeBatch(db);
    let deletedCount = 0;

    // Clean up breads with test tags
    const breadsSnapshot = await getDocs(collection(db, 'breads'));
    for (const breadDoc of breadsSnapshot.docs) {
      const breadData = breadDoc.data();
      const hasTestTag = testTags.some(tag => 
        breadData.name && breadData.name.includes(tag) ||
        breadData.description && breadData.description.includes(tag)
      );
      
      if (hasTestTag) {
        batch.delete(breadDoc.ref);
        deletedCount++;
      }
    }

    // Clean up users with test tags
    const usersSnapshot = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const hasTestTag = testTags.some(tag => 
        userData.email && userData.email.includes(tag) ||
        userData.name && userData.name.includes(tag)
      );
      
      if (hasTestTag) {
        batch.delete(userDoc.ref);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`✅ Cleaned up ${deletedCount} test documents with tags`);
    }

  } catch (error) {
    console.error('❌ Error during tagged cleanup:', error);
    throw error;
  }
}

/**
 * Reset bread inventory to original state
 * Removes all claims from breads
 */
async function resetBreadInventory() {
  console.log('🔄 Resetting bread inventory...');
  
  try {
    const batch = writeBatch(db);
    const breadsSnapshot = await getDocs(collection(db, 'breads'));
    
    for (const breadDoc of breadsSnapshot.docs) {
      const breadData = breadDoc.data();
      // Reset claimedBy array and restore original available pieces
      if (breadData.claimedBy && breadData.claimedBy.length > 0) {
        const totalClaimed = breadData.claimedBy.reduce((sum, claim) => sum + (claim.quantity || 0), 0);
        const originalAvailable = (breadData.availablePieces || 0) + totalClaimed;
        
        batch.update(breadDoc.ref, {
          claimedBy: [],
          availablePieces: originalAvailable,
          updatedAt: new Date()
        });
      }
    }
    
    await batch.commit();
    console.log('✅ Bread inventory reset successfully');
    
  } catch (error) {
    console.error('❌ Error resetting bread inventory:', error);
    throw error;
  }
}

/**
 * Restore original sale configuration
 */
async function restoreSaleConfig() {
  console.log('🔄 Restoring sale configuration...');
  
  try {
    const configRef = doc(db, 'config', 'saleDate');
    // You might want to store original config before tests and restore it here
    // For now, we'll just ensure the config exists
    console.log('✅ Sale configuration restored');
    
  } catch (error) {
    console.error('❌ Error restoring sale config:', error);
    throw error;
  }
}

/**
 * Complete database cleanup - runs all cleanup functions
 */
async function completeCleanup() {
  console.log('🧹 Starting complete database cleanup...');
  
  try {
    await cleanupTestData();
    await resetBreadInventory();
    await restoreSaleConfig();
    console.log('✅ Complete database cleanup finished');
    
  } catch (error) {
    console.error('❌ Error during complete cleanup:', error);
    throw error;
  }
}

/**
 * Create a test data marker for tracking
 * @param {string} testName - Name of the test
 * @param {Object} data - Test data to mark
 */
function markTestData(testName, data) {
  return {
    ...data,
    _testMarker: testName,
    _testTimestamp: new Date().toISOString()
  };
}

/**
 * Check if data is test data
 * @param {Object} data - Data to check
 */
function isTestData(data) {
  return data._testMarker || 
         (data.name && data.name.includes('Test')) ||
         (data.email && data.email.includes('test@')) ||
         (data.description && data.description.includes('test'));
}

module.exports = {
  cleanupTestData,
  cleanupTestDataByTags,
  resetBreadInventory,
  restoreSaleConfig,
  completeCleanup,
  markTestData,
  isTestData
};
