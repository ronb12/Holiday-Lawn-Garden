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
const app = firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth(app);
const db = firebase.firestore(app);

// Configure Firestore
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Export services to window object
window.auth = auth;
window.db = db;
window.firebase = firebase;

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