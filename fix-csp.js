const fs = require('fs');
const path = require('path');

// Function to update Content Security Policy
function updateCSP() {
  const indexPath = path.join(__dirname, 'index.html');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  const newCSP = `
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://*.cloudflare.com https://*.firebasestorage.app;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://*.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://*.firebasestorage.app https://cdnjs.cloudflare.com;
    script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://*.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://*.firebasestorage.app https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.cloudflare.com https://cdnjs.cloudflare.com;
    style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.cloudflare.com https://cdnjs.cloudflare.com;
    font-src 'self' https://fonts.gstatic.com https://*.cloudflare.com https://cdnjs.cloudflare.com;
    img-src 'self' data: https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://*.firebasestorage.app;
    connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://*.cloudflare.com https://www.google-analytics.com https://*.firebasestorage.app wss://*.firebaseio.com https://cdnjs.cloudflare.com;
    frame-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com https://*.firebasestorage.app;
  ">`;
  
  content = content.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/s, newCSP);
  fs.writeFileSync(indexPath, content);
  console.log('✅ Updated Content Security Policy');
}

// Function to fix Firebase initialization
function fixFirebaseInit() {
  const initPath = path.join(__dirname, 'js/firebase-init.js');
  let content = fs.readFileSync(initPath, 'utf8');
  
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

// Run all fixes
try {
  console.log('🔧 Starting fixes...');
  updateCSP();
  fixFirebaseInit();
  updateManifest();
  console.log('✨ All fixes completed successfully!');
} catch (error) {
  console.error('❌ Error during fixes:', error);
  process.exit(1);
} 