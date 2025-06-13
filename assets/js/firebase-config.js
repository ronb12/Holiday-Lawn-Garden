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

// Initialize Firebase with error handling
try {
  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const analytics = firebase.analytics();
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Configure Firestore settings
  db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
  });

  // Export Firebase instances
  window.firebaseApp = app;
  window.firebaseAnalytics = analytics;
  window.firebaseAuth = auth;
  window.firebaseDb = db;

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Show user-friendly error message
  const errorMessage = document.createElement('div');
  errorMessage.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ff4444; color: white; padding: 10px; text-align: center; z-index: 9999;';
  errorMessage.textContent = 'Unable to connect to services. Please try again later.';
  document.body.appendChild(errorMessage);
}

// Auth state observer with error handling
firebase.auth().onAuthStateChanged((user) => {
  try {
    const authRequiredElements = document.querySelectorAll('.auth-required');
    const authNotRequiredElements = document.querySelectorAll('.auth-not-required');
    const adminLink = document.getElementById('adminLink');

    if (user) {
      // User is signed in
      authRequiredElements.forEach(el => el.style.display = 'block');
      authNotRequiredElements.forEach(el => el.style.display = 'none');

      // Check if user is admin
      firebase.firestore().collection('users').doc(user.uid).get()
        .then((doc) => {
          if (doc.exists && doc.data().isAdmin) {
            if (adminLink) adminLink.style.display = 'block';
          }
        })
        .catch((error) => {
          console.error('Error checking admin status:', error);
        });
    } else {
      // User is signed out
      authRequiredElements.forEach(el => el.style.display = 'none');
      authNotRequiredElements.forEach(el => el.style.display = 'block');
      if (adminLink) adminLink.style.display = 'none';
    }
  } catch (error) {
    console.error('Error in auth state observer:', error);
  }
}); 