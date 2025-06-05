const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Ensure all required Firebase config variables are present
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Create Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Write Firebase configuration
const firebaseConfigContent = `// Firebase configuration
window.firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};`;

fs.writeFileSync(path.join(__dirname, 'firebase-config.js'), firebaseConfigContent);
fs.writeFileSync(path.join(distDir, 'firebase-config.js'), firebaseConfigContent);
console.log('✅ Firebase configuration generated successfully');

// Copy necessary files to dist
const filesToCopy = [
  'index.html',
  'firebase-init.js',
  'style.css',
  'modern-styles.css',
  'service-worker.js',
  'manifest.json',
  'Hollidays_Lawn_Garden_Logo.png',
  'assets/hero-garden-landscaping.jpg',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

filesToCopy.forEach(file => {
  try {
    const sourcePath = path.join(__dirname, file);
    const targetPath = path.join(distDir, file);

    // Create subdirectories if needed
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied ${file} to dist/`);
    } else {
      console.warn(`⚠️ Source file not found: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error copying ${file}:`, error);
  }
}); 