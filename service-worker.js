const CACHE_NAME = 'holliday-lawn-cache-v4';

const urlsToCache = [
  // Core HTML Shell
  './', // Alias for index.html
  './index.html',
  './login.html',
  './admin.html',
  './customer-dashboard.html',
  './manifest.json',

  // Core CSS
  './style.css',
  './modern-styles.css',

  // Core JS (Firebase and main app logic)
  './firebase-init.js',
  './login.js',
  './admin-functions.js',
  './customer-dashboard.js',
  './utils.js',

  // Additional JS Modules (add all that are critical for offline shell/core features)
  './equipment-manager.js',
  './loyalty-program.js',
  './material-tracker.js',
  './bidding-system.js',
  './sustainability-tracker.js',
  
  './route-optimizer.js',
  './payment-handler.js',
  // Note: Ensure these JS files don't immediately fail if APIs (weather, maps) are unavailable offline.
  // The service worker primarily ensures the *code* is available.

  // Key Images & Icons
  './icons/icon-192.png',
  './icons/icon-512.png',
  './Hollidays_Lawn_Garden_Logo.png',
  // Add other critical images, e.g., from assets, if they are part of the core shell experience
  // './assets/hero-garden-landscaping.jpg', // Example, uncomment if critical

  // Firebase SDKs (loaded from CDN, usually not cached by custom SW unless specifically proxied)
  // Consider caching if network reliability is extremely poor and you are self-hosting or proxying them.
  // For now, relying on browser cache for CDN resources.
];

// INSTALL: Cache core assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching core assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('❌ Error caching assets:', err))
  );
});

// ACTIVATE: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log(`🧹 Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH: Serve from cache, with fallback for navigation
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return new Response(`
            <!DOCTYPE html>
            <html lang="en"><head><meta charset="UTF-8"><title>Offline</title></head>
            <body style="font-family:sans-serif;text-align:center;padding:2em;">
              <h1>🔌 Offline</h1>
              <p>This page is not available offline.</p>
            </body></html>
          `, { headers: { 'Content-Type': 'text/html' } });
        }
      });
    })
  );
});
