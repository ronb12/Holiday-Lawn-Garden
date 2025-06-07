// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACm0j7I8RX4ExIQRoejfk1HZMOQRGigBw",
  authDomain: "holiday-lawn-and-garden.firebaseapp.com",
  projectId: "holiday-lawn-and-garden",
  storageBucket: "holiday-lawn-and-garden.firebasestorage.app",
  messagingSenderId: "135322230444",
  appId: "1:135322230444:web:1a487b25a48aae07368909",
  measurementId: "G-KD6TBWR4ZT"
};

// Initialize Firebase
try {
  // Initialize Firebase app
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Initialize services with latest settings
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  const analytics = firebase.analytics();

  // Configure Firestore
  db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    merge: true,
    ignoreUndefinedProperties: true,
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false
  });

  // Configure Auth
  auth.useDeviceLanguage();
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  // Configure Storage
  storage.setMaxUploadRetryTime(10000);
  storage.setMaxOperationRetryTime(10000);

  // Configure Analytics
  analytics.setAnalyticsCollectionEnabled(true);

  // Export to window for global access
  window.firebase = firebase;
  window.auth = auth;
  window.db = db;
  window.storage = storage;
  window.analytics = analytics;

  // Create a promise that resolves when Firebase is ready
  window.firebaseReady = Promise.resolve();

  console.log('Firebase initialized successfully with latest settings');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create error banner
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff4444;
    color: white;
    padding: 1rem;
    text-align: center;
    z-index: 9999;
  `;
  banner.textContent = 'Error initializing application. Please refresh the page.';
  document.body.appendChild(banner);
}

// Export for use in other files
window.firebaseConfig = firebaseConfig;

// Create a promise that resolves when Firebase is ready
window.firebaseReadyPromise = Promise.resolve(firebaseConfig); 