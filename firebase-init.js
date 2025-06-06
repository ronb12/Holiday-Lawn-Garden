// Wait for Firebase config to be available
async function initializeFirebaseDB() {
  try {
    // Wait for config to be available
    const config = await window.firebaseReadyPromise;
    if (!config) {
      throw new Error('Firebase configuration not found after waiting');
    }

    // Initialize Firebase app
    const app = firebase.initializeApp(config);

    // Initialize Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    const analytics = firebase.analytics();
    const performance = firebase.performance();

    // Create a global app object
    window.HollidayApp = {
      auth,
      db,
      storage,
      analytics,
      performance
    };

    // Enable offline persistence
    await db.enablePersistence().catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence.');
      }
    });

    // Handle auth state changes
    auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        // Update UI for signed-in user
        document.querySelectorAll('.auth-required').forEach(el => {
          el.style.display = 'block';
        });
        document.querySelectorAll('.auth-not-required').forEach(el => {
          el.style.display = 'none';
        });
      } else {
        // User is signed out
        console.log('User is signed out');
        // Update UI for signed-out user
        document.querySelectorAll('.auth-required').forEach(el => {
          el.style.display = 'none';
        });
        document.querySelectorAll('.auth-not-required').forEach(el => {
          el.style.display = 'block';
        });
      }
    });

    // Export Firebase services
    return { auth, db, storage, analytics, performance };
  } catch (error) {
    console.error('❌ Firebase init error:', error);
    throw error;
  }
}

// Initialize Firebase when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebaseDB().catch(console.error);
});

// Export the initialization function
export { initializeFirebaseDB }; 