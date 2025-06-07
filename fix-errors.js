const fs = require('fs');
const path = require('path');

// Function to update Content Security Policy in index.html
function updateCSP() {
  const indexPath = path.join(__dirname, 'index.html');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  const newCSP = `
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://*.cloudflare.com;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://*.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.cloudflare.com;
    style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.cloudflare.com;
    font-src 'self' https://fonts.gstatic.com https://*.cloudflare.com;
    img-src 'self' data: https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com;
    connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://*.cloudflare.com https://www.google-analytics.com;
    frame-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com;
  ">`;
  
  // Replace existing CSP
  content = content.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/s, newCSP);
  fs.writeFileSync(indexPath, content);
  console.log('✅ Updated Content Security Policy');
}

// Function to fix Firebase initialization
function fixFirebaseInit() {
  const initPath = path.join(__dirname, 'js/firebase-init.js');
  let content = fs.readFileSync(initPath, 'utf8');
  
  // Update Firestore settings
  const newSettings = `
  db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    merge: true,
    ignoreUndefinedProperties: true,
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false
  });`;
  
  content = content.replace(/db\.settings\(\{[^}]*\}\);/s, newSettings);
  fs.writeFileSync(initPath, content);
  console.log('✅ Fixed Firebase initialization');
}

// Function to update manifest.json
function updateManifest() {
  const manifestPath = path.join(__dirname, 'manifest.json');
  let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Update icon paths
  manifest.icons = [
    {
      "src": "assets/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ];
  
  manifest.start_url = "/";
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated manifest.json');
}

// Function to update service worker
function updateServiceWorker() {
  const swPath = path.join(__dirname, 'service-worker.js');
  let content = fs.readFileSync(swPath, 'utf8');
  
  // Update Firebase SDK versions
  const newSDKs = [
    'https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.8.1/firebase-storage-compat.js',
    'https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics-compat.js'
  ];
  
  content = content.replace(/const FIREBASE_SDKS = \[[^\]]*\]/s, `const FIREBASE_SDKS = ${JSON.stringify(newSDKs)}`);
  fs.writeFileSync(swPath, content);
  console.log('✅ Updated service worker');
}

// Main function to run all fixes
function fixAll() {
  try {
    console.log('🔧 Starting fixes...');
    updateCSP();
    fixFirebaseInit();
    updateManifest();
    updateServiceWorker();
    console.log('✨ All fixes completed successfully!');
  } catch (error) {
    console.error('❌ Error during fixes:', error);
    process.exit(1);
  }
}

// Run the fixes
fixAll(); 