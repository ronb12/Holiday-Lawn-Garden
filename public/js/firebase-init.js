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

// Initialize Firestore with settings
function initializeFirebaseDB() {
  try {
    const db = firebase.firestore();
    db.settings({
      cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
      merge: true,
      ignoreUndefinedProperties: true,
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false
    });
    console.log('Firestore initialized successfully');
    return db;
  } catch (error) {
    console.error('Firestore initialization error:', error);
    throw error;
  }
}

// Initialize Analytics
function initializeAnalytics() {
  try {
    const analytics = firebase.analytics();
    analytics.setAnalyticsCollectionEnabled(true);
    console.log('Analytics initialized successfully');
    return analytics;
  } catch (error) {
    console.error('Analytics initialization error:', error);
    throw error;
  }
}

// Main initialization function
async function initializeFirebase() {
  try {
    // Wait for Firebase to be ready
    await window.firebaseReady;
    
    // Initialize services
    const db = initializeFirebaseDB();
    const analytics = initializeAnalytics();
    
    // Export to window
    window.db = db;
    window.analytics = analytics;
    
    console.log('Firebase services initialized successfully');
  } catch (error) {
    console.error('Firebase services initialization error:', error);
    throw error;
  }
}

// Export to window
window.initializeFirebase = initializeFirebase;

// Wait for Firebase to be ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize services
    const { auth, db, storage, analytics } = await initializeFirebaseDB();
    
    // Store Firebase services globally
    window.HollidayApp = { auth, db, storage, analytics };
    
    // Handle auth state changes
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User is signed in:', user.email);
        document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.auth-not-required').forEach(el => el.style.display = 'none');
        
        // Check for admin access
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
          const allowedAdmins = ["ronellbradley@bradleyvs.com"];
          if (allowedAdmins.includes(user.email)) {
            adminLink.style.display = 'block';
          }
        }
      } else {
        console.log('User is signed out');
        document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.auth-not-required').forEach(el => el.style.display = 'block');
        
        // Hide admin link
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
          adminLink.style.display = 'none';
        }
      }
    });
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    showError('Failed to initialize the application. Please refresh the page.');
  }
});

// Error handling
function showError(message) {
  const errorBanner = document.createElement('div');
  errorBanner.className = 'error-banner';
  errorBanner.textContent = message;
  document.body.appendChild(errorBanner);
} 