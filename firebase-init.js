// Initialize Firebase with retry mechanism
async function initializeFirebaseDB(retryCount = 0, maxRetries = 3) {
  try {
    // Wait for config to be available
    const config = await window.firebaseReadyPromise;
    if (!config) {
      throw new Error('Firebase configuration not found after waiting');
    }

    // Initialize Firebase app
    const app = firebase.initializeApp(config);

    // Initialize Firebase services with error handling
    const services = {};
    try {
      services.auth = firebase.auth();
      services.db = firebase.firestore();
      services.storage = firebase.storage();
      services.analytics = firebase.analytics();
      services.performance = firebase.performance();
    } catch (error) {
      console.error('Error initializing Firebase services:', error);
      throw error;
    }

    // Create a global app object
    window.HollidayApp = services;

    // Enable offline persistence with error handling
    try {
      await services.db.enablePersistence({
        synchronizeTabs: true
      }).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support persistence.');
        }
      });
    } catch (error) {
      console.warn('Failed to enable offline persistence:', error);
    }

    // Handle auth state changes
    services.auth.onAuthStateChanged((user) => {
      try {
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
      } catch (error) {
        console.error('Error handling auth state change:', error);
      }
    });

    return services;
  } catch (error) {
    console.error('❌ Firebase init error:', error);
    
    // Retry logic
    if (retryCount < maxRetries) {
      console.log(`Retrying Firebase initialization (${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return initializeFirebaseDB(retryCount + 1, maxRetries);
    }
    
    throw error;
  }
}

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