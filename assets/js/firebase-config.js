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
window.auth.onAuthStateChanged((user) => {
  try {
    const authRequiredElements = document.querySelectorAll('.auth-required');
    const adminLink = document.getElementById('adminLink');
    
    if (user) {
      // User is signed in
      authRequiredElements.forEach(element => {
        element.style.display = 'block';
      });
      
      // Check if user is admin
      window.db.collection('users').doc(user.uid).get()
        .then((doc) => {
          if (doc.exists && doc.data().isAdmin) {
            if (adminLink) {
              adminLink.style.display = 'block';
            }
          }
        })
        .catch((error) => {
          console.error("Error checking admin status:", error);
        });
    } else {
      // User is signed out
      authRequiredElements.forEach(element => {
        element.style.display = 'none';
      });
      if (adminLink) {
        adminLink.style.display = 'none';
      }
    }
  } catch (error) {
    console.error("Auth state change error:", error);
  }
}); 