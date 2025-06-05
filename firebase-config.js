// Firebase configuration for GitHub Pages deployment
const firebaseConfig = {
  apiKey: "AIzaSyDGBZnNBEVZXuuDUkQxQvFmQPzEXCGYzwE",
  authDomain: "holliday-lawn-garden.firebaseapp.com",
  projectId: "holliday-lawn-garden",
  storageBucket: "holliday-lawn-garden.appspot.com",
  messagingSenderId: "1098127322593",
  appId: "1:1098127322593:web:e6c9a9c4d899c94f7e1ad8",
  measurementId: "G-QWZQXV9QY6",
  databaseURL: "https://holiday-lawn-and-garden.firebaseio.com"
};

// Initialize Firebase with explicit options for GitHub Pages
async function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
    }

    // Initialize services with error handling
    const auth = firebase.auth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    const firestore = firebase.firestore();
    await firestore.enablePersistence({ synchronizeTabs: true })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support persistence.');
        }
      });

    const storage = firebase.storage();
    const analytics = firebase.analytics();

    // Make services available globally
    window.HollidayApp = {
      auth,
      db: firestore,
      storage,
      analytics,
      config: firebaseConfig,
      initialized: true
    };

    console.log('✅ Firebase services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
}

// Initialize Firebase when the script loads
initializeFirebase().catch(console.error);

// Make config and initialization function available globally
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase; 