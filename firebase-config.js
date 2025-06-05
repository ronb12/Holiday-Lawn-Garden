// Firebase configuration - Production environment
window.firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyACm0j7I8RX4ExIQRoejfk1HZMOQRGigBw",
  authDomain: "holiday-lawn-and-garden.firebaseapp.com",
  projectId: "holiday-lawn-and-garden",
  storageBucket: "holiday-lawn-and-garden.firebasestorage.app",
  messagingSenderId: "135322230444",
  appId: process.env.FIREBASE_APP_ID || "1:135322230444:web:1a487b25a48aae07368909",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-KD6TBWR4ZT"
};
