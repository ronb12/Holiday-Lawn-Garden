const fs = require('fs');
require('dotenv').config();

// Create a configuration file during build
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Create the output directory if it doesn't exist
if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
}

// Write the configuration
const configContent = `
window.firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};
window.googleClientId = "${process.env.GOOGLE_CLIENT_ID}";
`;

fs.writeFileSync('./dist/firebase-config.js', configContent); 