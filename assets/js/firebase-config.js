// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

// Export services to window object
window.auth = auth;
window.db = db;

// Auth state observer with error handling
auth.onAuthStateChanged((user) => {
  try {
    const authRequiredElements = document.querySelectorAll(".auth-required");
    const adminLink = document.getElementById("adminLink");
    
    if (user) {
      // User is signed in
      authRequiredElements.forEach(element => {
        element.style.display = "block";
      });
      
      // Check if user is admin
      getDoc(doc(collection(db, "users"), user.uid))
        .then((docSnap) => {
          if (docSnap.exists() && docSnap.data().isAdmin) {
            if (adminLink) {
              adminLink.style.display = "block";
            }
          }
        })
        .catch((error) => {
          console.error("Error checking admin status:", error);
        });
    } else {
      // User is signed out
      authRequiredElements.forEach(element => {
        element.style.display = "none";
      });
      if (adminLink) {
        adminLink.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Auth state change error:", error);
  }
});