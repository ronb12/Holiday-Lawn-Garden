// firebase-init.js
// This file handles Firebase initialization and provides a ready state promise

// Create a global namespace for our app
window.HollidayApp = window.HollidayApp || {};

// Initialize Firebase with error handling
async function initializeFirebase() {
  try {
    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded');
      return false;
    }

    // Initialize Firebase if not already initialized
    if (firebase.apps.length === 0) {
      firebase.initializeApp({
        apiKey: "AIzaSyACm0j7I8RX4ExIQRoejfk1HZMOQRGigBw",
        authDomain: "holiday-lawn-and-garden.firebaseapp.com",
        projectId: "holiday-lawn-and-garden",
        storageBucket: "holiday-lawn-and-garden.firebasestorage.app",
        messagingSenderId: "135322230444",
        appId: "1:135322230444:web:1a487b25a48aae07368909",
        measurementId: "G-KD6TBWR4ZT"
      });
      console.log('✅ Firebase initialized successfully');
    }

    // Initialize services
    const db = firebase.firestore();
    const auth = firebase.auth();

    // Enable offline persistence
    await db.enablePersistence()
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support offline persistence');
        }
      });

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
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
  initializeFirebase();
}

// Export the initialization promise
window.firebaseReadyPromise = initializeFirebase();
