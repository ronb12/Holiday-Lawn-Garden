// Automated Test Runner
async function autoRunTests() {
  console.log('🚀 Starting Automated Test Suite\n');
  
  let results;
  try {
    // Initialize Firebase if not already initialized
    if (!window.HollidayApp || !window.HollidayApp.db) {
      console.log('⚙️ Initializing Firebase...');
      await initializeFirebase();
    }

    // Run the test workflow
    results = await window.testCustomerWorkflow();
    
    // If test completes successfully, clean up
    if (results) {
      console.log('\n🧹 Cleaning up test data...');
      await window.cleanupTestData(results);
    }
  } catch (error) {
    console.error('\n❌ Auto-run encountered an error:', error);
    
    // Attempt to fix common errors
    if (error.message.includes('not logged in')) {
      console.log('🔄 Attempting to log in as admin...');
      try {
        await window.productionSetup.loginAsAdmin();
        console.log('✅ Admin login successful, retrying test...');
        results = await window.testCustomerWorkflow();
      } catch (loginError) {
        console.error('❌ Admin login failed:', loginError);
      }
    }
  }
}

// Initialize Firebase helper function
async function initializeFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase SDK not loaded');
    }
    
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
      firebase.initializeApp(window.firebaseConfig);
    }
    
    // Initialize Firestore
    window.HollidayApp = window.HollidayApp || {};
    window.HollidayApp.db = firebase.firestore();
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

// Auto-start when the page loads
window.addEventListener('load', () => {
  console.log('🔄 Page loaded, starting automated tests...');
  autoRunTests();
});

// Make function available globally
window.autoRunTests = autoRunTests; 