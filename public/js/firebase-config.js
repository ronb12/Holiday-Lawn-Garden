// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  try {
  firebase.initializeApp(firebaseConfig)
} catch (error) {
  console.error('Firebase initialization error:', error);
};
  firebase.analytics();
} else {
  console.error('Firebase SDK not loaded');
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

// Export for use in other files
window.firebaseConfig = firebaseConfig;

// Create a promise that resolves when Firebase is ready
window.firebaseReadyPromise = Promise.resolve(firebaseConfig); 