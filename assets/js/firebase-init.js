// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
  getAnalytics,
  isSupported,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js';

// Import configuration
import { firebaseConfig, showError } from './firebase.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics if supported
let analytics = null;
if (await isSupported()) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

export async function initializeFirebase() {
  try {
    // Initialize Firebase app
    if (!app) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized');
    }

    // Initialize services
    if (!auth) {
      auth = getAuth(app);
      console.log('Firebase Auth initialized');
    }

    if (!db) {
      db = getFirestore(app);
      console.log('Firestore initialized');
    }

    if (!googleProvider) {
      googleProvider = new GoogleAuthProvider();
      console.log('Google Auth Provider initialized');
    }

    // Initialize Analytics if supported
    if (!analytics && (await isSupported())) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    }

    // Make services available globally
    window.HollidayApp = {
      app,
      auth,
      db,
      analytics,
      googleProvider,
    };

    // Set up auth state listener
    if (auth) {
      onAuthStateChanged(auth, user => {
        if (user) {
          console.log('User is signed in:', user.uid);
          // Update UI for signed-in user
          document.body.classList.add('user-signed-in');
          updateUIForSignedInUser(user);
        } else {
          console.log('User is signed out');
          // Update UI for signed-out user
          document.body.classList.remove('user-signed-in');
          updateUIForSignedOutUser();
        }
      });
    } else {
      throw new Error('Auth service not initialized');
    }

    console.log('Firebase initialization complete');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    showError('Failed to initialize Firebase. Please refresh the page.', error);
    return false;
  }
}

// Update UI for signed-in user
function updateUIForSignedInUser(user) {
  const loginLink = document.querySelector('a[href="/pages/login.html"]');
  if (loginLink) {
    loginLink.textContent = 'My Account';
    loginLink.href = '/pages/account.html';
  }
}

// Update UI for signed-out user
function updateUIForSignedOutUser() {
  const loginLink = document.querySelector('a[href="/pages/account.html"]');
  if (loginLink) {
    loginLink.textContent = 'Login';
    loginLink.href = '/pages/login.html';
  }
}

// Export initialized services
export { app, auth, db, analytics, googleProvider };
