// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACm0j7I8RX4ExIQRoejfk1HZMOQRGigBw",
  authDomain: "holiday-lawn-and-garden.firebaseapp.com",
  projectId: "holiday-lawn-and-garden",
  storageBucket: "holiday-lawn-and-garden.firebasestorage.app",
  messagingSenderId: "135322230444",
  appId: "1:135322230444:web:1a487b25a48aae07368909",
  measurementId: "G-KD6TBWR4ZT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize services
const auth = firebase.auth(app);
const db = firebase.firestore(app);

// Configure Firestore
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  merge: true
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