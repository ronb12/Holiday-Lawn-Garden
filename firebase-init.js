// firebase-init.js
// This file now uses the configuration generated during build

window.firebaseReadyPromise = new Promise((resolve, reject) => {
  function initializeFirebase() {
    if (window.firebaseConfig) {
      if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
        firebase.initializeApp(window.firebaseConfig);
      }
      resolve();
    } else {
      reject('Firebase configuration not found. Please ensure the application is built correctly.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
  } else {
    initializeFirebase();
  }
});
