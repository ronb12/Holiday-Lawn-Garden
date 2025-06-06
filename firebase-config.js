// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "holliday-lawn-garden.firebaseapp.com",
  projectId: "holliday-lawn-garden",
  storageBucket: "holliday-lawn-garden.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
};

// Validate configuration
function validateConfig(config) {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required Firebase config field: ${field}`);
    }
  }
}

// Initialize Firebase
try {
  validateConfig(firebaseConfig);
  window.firebaseConfig = firebaseConfig;
} catch (error) {
  console.error('Firebase configuration error:', error);
  throw error;
} 