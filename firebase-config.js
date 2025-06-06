// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
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
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
  }
  
  return config;
}

// Make config available globally with validation
try {
  const validatedConfig = validateConfig(firebaseConfig);
  window.firebaseConfig = validatedConfig;
  window.firebaseReadyPromise = Promise.resolve(validatedConfig);
} catch (error) {
  console.error('Firebase configuration error:', error);
  window.firebaseReadyPromise = Promise.reject(error);
} 