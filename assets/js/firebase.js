// Firebase configuration with enhanced error handling
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { getAnalytics, isSupported, logEvent } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js';

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyACm0j7I8RX4ExIQRoejfk1HZMOQRGigBw",
  authDomain: "holiday-lawn-and-garden.firebaseapp.com",
  projectId: "holiday-lawn-and-garden",
  storageBucket: "holiday-lawn-and-garden.firebasestorage.app",
  messagingSenderId: "135322230444",
  appId: "1:135322230444:web:1a487b25a48aae07368909",
  measurementId: "G-KD6TBWR4ZT"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Initialize Analytics if supported
  if (await isSupported()) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  showError('Failed to initialize the application. Please refresh the page.', true);
  throw error;
}

export { app, auth, db, storage, analytics };

// Export Firebase modules
export {
  initializeApp,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getAnalytics,
  isSupported,
  logEvent
};

// Utility functions
export function showError(message, isFatal = false) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  if (!isFatal) {
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

export function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-spinner';
  loadingDiv.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(loadingDiv);
}

export function hideLoading() {
  const loadingDiv = document.querySelector('.loading-spinner');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

// Initialize Firebase if not already initialized
export async function initializeFirebase() {
  if (!window.HollidayApp) {
    try {
      const app = initializeApp(firebaseConfig);
      return app;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      showError('Failed to initialize the application. Please refresh the page.', true);
      throw error;
    }
  }
  return window.HollidayApp.app;
} 