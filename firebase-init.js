// firebase-init.js
// This file handles Firebase initialization and provides a ready state promise

// Create a global namespace for our app
window.HollidayApp = window.HollidayApp || {};

// Initialize Firebase with error handling
let initializationPromise = null;

async function initializeFirebase() {
  // Return existing initialization if already in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Check if Firebase SDK is loaded
      if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded');
        return false;
      }

      // Check if config is available
      if (!window.firebaseConfig) {
        console.error('Firebase configuration not found');
        return false;
      }

      // Initialize Firebase if not already initialized
      if (firebase.apps.length === 0) {
        firebase.initializeApp(window.firebaseConfig);
        console.log('✅ Firebase initialized successfully');
        
        // Configure Firestore settings before initializing
        const settings = {
          cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
          cache: 'persistent',
          merge: true
        };
        firebase.firestore().settings(settings);
      }

      // Initialize services
      const db = firebase.firestore();
      const auth = firebase.auth();

      // Export Firebase instances
      window.HollidayApp.db = db;
      window.HollidayApp.auth = auth;

      // Set up auth state listener
      auth.onAuthStateChanged((user) => {
        window.HollidayApp.currentUser = user;
        const event = new CustomEvent('hollidayAuthStateChanged', { detail: { user } });
        window.dispatchEvent(event);
      });

      // Test database connection
      try {
        await db.collection('users').limit(1).get();
        console.log('✅ Database connection test successful');
        return true;
      } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  })();

  return initializationPromise;
}

// Initialize only once when page loads
const firebaseReady = initializeFirebase();

// Export the initialization promise
window.firebaseReadyPromise = firebaseReady;

// Add error event listener for failed script loads
window.addEventListener('error', function(e) {
  if (e.target.src && e.target.src.includes('firebase')) {
    console.error('Failed to load Firebase script:', e.target.src);
    showNotification('Failed to load Firebase. Please check your internet connection and refresh the page.', 'error');
  }
}, true);
