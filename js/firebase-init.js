// Create a promise that will be resolved when Firebase config is ready
window.firebaseReadyPromise = new Promise((resolve) => {
  // Check if config is already available
  if (window.firebaseConfig) {
    resolve(window.firebaseConfig);
  } else {
    // Wait for config to be set
    const checkConfig = setInterval(() => {
      if (window.firebaseConfig) {
        clearInterval(checkConfig);
        resolve(window.firebaseConfig);
      }
    }, 100);
  }
});

// Initialize Firebase services
async function initializeFirebaseDB() {
  try {
    // Check if Firebase is initialized
    if (!firebase.apps.length) {
      throw new Error('Firebase not initialized');
    }

    // Initialize services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    const analytics = firebase.analytics();

    // Configure Firestore settings with cache
    const settings = {
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true,
      merge: true
    };
    await db.settings(settings);

    // Enable analytics with error handling
    try {
      analytics.setAnalyticsCollectionEnabled(true);
    } catch (analyticsError) {
      console.warn('Analytics initialization warning:', analyticsError);
      // Continue even if analytics fails
    }

    console.log('✅ Firebase services initialized successfully');
    return { auth, db, storage, analytics };
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
}

// Export initialization function
window.initializeFirebaseDB = initializeFirebaseDB;

// Initialize Firebase when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebaseDB().catch(error => {
    console.error('Failed to initialize Firebase:', error);
    // Show error to user
    const errorBanner = document.createElement('div');
    errorBanner.className = 'error-banner';
    errorBanner.textContent = 'Unable to connect to the service. Please refresh the page.';
    document.body.appendChild(errorBanner);
  });
}); 