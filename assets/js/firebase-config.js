// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "holiday-lawn-and-garden.firebaseapp.com",
  projectId: "holiday-lawn-and-garden",
  storageBucket: "holiday-lawn-and-garden.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firestore with settings
firebase.firestore().settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  merge: true
});

// Initialize Analytics
const analytics = firebase.analytics(app);

// Export Firebase services to window object
window.auth = firebase.auth(app);
window.db = firebase.firestore(app);
window.storage = firebase.storage(app);
window.analytics = analytics;

// Auth state observer with error handling
firebase.auth(app).onAuthStateChanged((user) => {
  try {
    const authRequiredElements = document.querySelectorAll('.auth-required');
    const authNotRequiredElements = document.querySelectorAll('.auth-not-required');
    const adminLink = document.getElementById('adminLink');

    if (user) {
      // User is signed in
      authRequiredElements.forEach(el => el.style.display = 'block');
      authNotRequiredElements.forEach(el => el.style.display = 'none');

      // Check if user is admin
      firebase.firestore(app).collection('users').doc(user.uid).get()
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