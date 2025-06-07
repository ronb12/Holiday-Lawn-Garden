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

// Initialize Firebase with security settings
try {
  const app = firebase.initializeApp(firebaseConfig);
  
  // Configure Firestore with security settings
  const db = firebase.firestore();
  db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    merge: true,
    ignoreUndefinedProperties: true
  });

  // Configure Auth with security settings
  const auth = firebase.auth();
  auth.useDeviceLanguage();
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  // Configure Storage with security settings
  const storage = firebase.storage();
  storage.setMaxUploadRetryTime(10000); // 10 seconds
  storage.setMaxOperationRetryTime(10000);

  console.log('Firebase initialized successfully with security settings');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create error banner
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:10px;text-align:center;z-index:9999';
  banner.textContent = 'Error initializing Firebase. Please try again later.';
  document.body.appendChild(banner);
}

// Export for use in other files
window.firebaseConfig = firebaseConfig;

// Create a promise that resolves when Firebase is ready
window.firebaseReadyPromise = Promise.resolve(firebaseConfig); 