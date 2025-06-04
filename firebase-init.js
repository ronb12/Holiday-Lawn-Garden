// firebase-init.js
// This file now uses the configuration generated during build

// Wait for the configuration to be available
function initializeFirebase() {
    if (window.firebaseConfig) {
        firebase.initializeApp(window.firebaseConfig);
    } else {
        console.error('Firebase configuration not found. Please ensure the application is built correctly.');
    }
}

// Initialize when the configuration is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}
