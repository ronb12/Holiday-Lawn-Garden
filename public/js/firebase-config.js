// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  authDomain: "holiday-lawn-and-garden.firebaseapp.com",
  projectId: "holiday-lawn-and-garden",
  storageBucket: "holiday-lawn-and-garden.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
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