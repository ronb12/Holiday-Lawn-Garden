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
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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

      // Enable offline persistence
      await db.enablePersistence()
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support persistence.');
          }
        });

      console.log('✅ Firebase services initialized successfully');
      return { auth, db, storage, analytics };
    } catch (error) {
      console.error(`❌ Firebase init error: ${error}`);
      
      if (attempt < maxRetries) {
        console.log(`Retrying Firebase initialization (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('Failed to initialize Firebase after all retries:', error);
        throw error;
      }
    }
  }
}

// Export initialization function
window.initializeFirebaseDB = initializeFirebaseDB;

// Initialize Firebase when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebaseDB().catch(error => {
    console.error('Failed to initialize Firebase after all retries:', error);
    // Show error to user
    const errorBanner = document.createElement('div');
    errorBanner.className = 'error-banner';
    errorBanner.textContent = 'Unable to connect to the service. Please refresh the page or try again later.';
    document.body.appendChild(errorBanner);
  });
}); 