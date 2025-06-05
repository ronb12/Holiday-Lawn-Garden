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
if (typeof firebase !== 'undefined') {
  try {
    // Initialize with explicit config for GitHub Pages
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    // Initialize services
    const auth = firebase.auth();
    const firestore = firebase.firestore();
    const storage = firebase.storage();
    const analytics = firebase.analytics();
    
    // Make services available globally
    window.HollidayApp = {
      auth,
      db: firestore,
      storage,
      analytics,
      config: firebaseConfig
    };
    
    console.log('✅ Firebase configuration loaded successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}

// Make config available globally
window.firebaseConfig = firebaseConfig; 