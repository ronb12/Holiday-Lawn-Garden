// Firebase configuration for GitHub Pages deployment
const firebaseConfig = {
  apiKey: "AIzaSyACm0j7I8RX4ExIQRoejfk1HZMOQRGigBw",
  authDomain: "holiday-lawn-and-garden.firebaseapp.com",
  projectId: "holiday-lawn-and-garden",
  storageBucket: "holiday-lawn-and-garden.appspot.com",
  messagingSenderId: "135322230444",
  appId: "1:135322230444:web:1a487b25a48aae07368909",
  measurementId: "G-KD6TBWR4ZT",
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