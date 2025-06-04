// firebase-init.js
// This file handles Firebase initialization and provides a ready state promise

// Create a global namespace for our app
window.HollidayApp = window.HollidayApp || {};

window.firebaseReadyPromise = new Promise((resolve, reject) => {
  async function initializeFirebase() {
    try {
      // Check if Firebase SDK is loaded
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded');
      }

      // Check if config exists
      if (!window.firebaseConfig) {
        throw new Error('Firebase configuration not found');
      }

      // Initialize Firebase if not already initialized
      if (firebase.apps.length === 0) {
        firebase.initializeApp(window.firebaseConfig);
        console.log('Firebase initialized successfully');
      }

      // Initialize Firestore and Auth references
      window.HollidayApp.db = firebase.firestore();
      window.HollidayApp.auth = firebase.auth();

      // Set up auth state listener
      window.HollidayApp.auth.onAuthStateChanged((user) => {
        window.HollidayApp.currentUser = user;
        const event = new CustomEvent('hollidayAuthStateChanged', { detail: { user } });
        window.dispatchEvent(event);
      });

      // Resolve the promise with the initialized app
      resolve({
        db: window.HollidayApp.db,
        auth: window.HollidayApp.auth
      });
    } catch (error) {
      console.error('Firebase initialization error:', error);
      reject(error);
    }
  }

  // Initialize immediately if document is ready, otherwise wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
  } else {
    initializeFirebase();
  }
});
