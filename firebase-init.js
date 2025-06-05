// firebase-init.js
// This file handles Firebase initialization and provides a ready state promise

// Create a global namespace for our app
window.HollidayApp = window.HollidayApp || {};

// Initialize Firebase with error handling
let initializationPromise = null;

async function initializeFirebaseDB() {
  // Return existing initialization if already in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Wait for Firebase SDK to be available
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded');
      }

      // Wait for config to be available
      let attempts = 0;
      while (!window.firebaseConfig && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!window.firebaseConfig) {
        throw new Error('Firebase configuration not found after waiting');
      }

      // Initialize Firebase if not already initialized
      if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
      }

      // Initialize Firebase services with error handling
      window.HollidayApp = window.HollidayApp || {};
      
      try {
        window.HollidayApp.auth = firebase.auth();
        console.log('✅ Firebase Auth initialized');
      } catch (error) {
        console.error('❌ Firebase Auth initialization error:', error);
      }

      try {
        window.HollidayApp.db = firebase.firestore();
        console.log('✅ Firebase Firestore initialized');
      } catch (error) {
        console.error('❌ Firebase Firestore initialization error:', error);
        throw error; // Firestore is critical, so we throw the error
      }

      try {
        // Check if storage module is available
        if (typeof firebase.storage === 'function') {
          window.HollidayApp.storage = firebase.storage();
          console.log('✅ Firebase Storage initialized');
        } else {
          console.warn('⚠️ Firebase Storage module not available');
        }
      } catch (error) {
        console.warn('⚠️ Firebase Storage initialization error:', error);
        // Don't throw error as storage is optional
      }

      try {
        if (typeof firebase.analytics === 'function') {
          window.HollidayApp.analytics = firebase.analytics();
          console.log('✅ Firebase Analytics initialized');
        } else {
          console.warn('⚠️ Firebase Analytics module not available');
        }
      } catch (error) {
        console.warn('⚠️ Firebase Analytics initialization error:', error);
        // Don't throw error as analytics is optional
      }

      // Configure Firestore settings
      const settings = {
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        merge: true
      };
      window.HollidayApp.db.settings(settings);

      // Enable offline persistence with correct method for Firebase 9.x
      try {
        await window.HollidayApp.db.enablePersistence({
          synchronizeTabs: true
        });
        console.log('✅ Offline persistence enabled');
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only');
        } else if (err.code === 'unimplemented') {
          console.warn('⚠️ Current browser doesn\'t support persistence');
        } else {
          console.error('❌ Error enabling persistence:', err);
        }
      }

      // Set up authentication state observer
      window.HollidayApp.auth.onAuthStateChanged((user) => {
        window.HollidayApp.currentUser = user;
        const event = new CustomEvent('authStateChanged', { detail: { user } });
        window.dispatchEvent(event);
      });

      // Test database connection
      try {
        // First check if user is authenticated
        const currentUser = window.HollidayApp.auth.currentUser;
        if (!currentUser) {
          console.log('⚠️ No user authenticated yet - skipping database test');
          return true;
        }

        // Try to read public business settings first
        await window.HollidayApp.db.collection('business_settings').doc('company_info').get();
        console.log('✅ Database connection test successful');
      } catch (error) {
        if (error.code === 'permission-denied') {
          console.log('⚠️ Database access restricted - please log in first');
        } else {
          console.warn('⚠️ Database connection test failed:', error);
        }
        // Don't throw here, as the app might work in offline mode or need authentication
      }

      console.log('✅ Firebase initialization completed');
      return true;
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

// Initialize only once when page loads
const firebaseReady = initializeFirebaseDB();

// Export the initialization promise
window.firebaseReadyPromise = firebaseReady;

// Add error event listener for failed script loads
window.addEventListener('error', function(e) {
  if (e.target.src && e.target.src.includes('firebase')) {
    console.error('Failed to load Firebase script:', e.target.src);
    showNotification('Failed to load Firebase. Please check your internet connection and refresh the page.', 'error');
  }
}, true);

// Make initialization function available globally
window.initializeFirebaseDB = initializeFirebaseDB;

// Add helper functions for common Firebase operations
window.HollidayApp.isAuthenticated = () => {
  return window.HollidayApp.auth && window.HollidayApp.auth.currentUser !== null;
};

window.HollidayApp.isAdmin = async () => {
  if (!window.HollidayApp.isAuthenticated()) return false;
  try {
    const userDoc = await window.HollidayApp.db
      .collection('users')
      .doc(window.HollidayApp.auth.currentUser.uid)
      .get();
    return userDoc.exists && userDoc.data().role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
