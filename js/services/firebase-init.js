// Firebase initialization with error handling
window.HollidayApp = window.HollidayApp || {};

async function initializeFirebase() {
  try {
    // Check if Firebase config exists
    if (!firebaseConfig) {
      throw new Error('Firebase configuration not found');
    }

    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Initialize services
    window.HollidayApp.auth = firebase.auth();
    window.HollidayApp.db = firebase.firestore();
    window.HollidayApp.storage = firebase.storage();
    window.HollidayApp.analytics = firebase.analytics();

    // Enable offline persistence
    await window.HollidayApp.db.enablePersistence()
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support persistence.');
        }
      });

    // Set up auth state listener
    window.HollidayApp.auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('🔐 User authenticated:', user.email);
        // Update UI for authenticated state
        const authElements = document.querySelectorAll('[data-auth-required]');
        authElements.forEach(el => el.style.display = 'block');
        const noAuthElements = document.querySelectorAll('[data-no-auth-required]');
        noAuthElements.forEach(el => el.style.display = 'none');
      } else {
        console.log('👤 No user authenticated');
        // Update UI for non-authenticated state
        const authElements = document.querySelectorAll('[data-auth-required]');
        authElements.forEach(el => el.style.display = 'none');
        const noAuthElements = document.querySelectorAll('[data-no-auth-required]');
        noAuthElements.forEach(el => el.style.display = 'block');
        
        // Redirect to login if on admin page
        if (window.location.pathname.includes('admin')) {
          window.location.href = 'login.html';
        }
      }
    });

    console.log('✅ Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    // Show error message to user
    const errorDiv = document.getElementById('firebaseError');
    if (errorDiv) {
      errorDiv.textContent = `Firebase initialization failed: ${error.message}`;
      errorDiv.style.display = 'block';
    }
    return false;
  }
}

// Initialize Firebase when the page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase().then(success => {
    if (success) {
      // Dispatch event for other scripts that depend on Firebase
      window.dispatchEvent(new Event('firebaseInitialized'));
    }
  });
}); 