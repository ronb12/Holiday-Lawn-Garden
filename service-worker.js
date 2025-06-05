const CACHE_NAME = 'holliday-lawn-cache-v5';
const OFFLINE_URL = '/Holliday-Lawn-Garden/offline.html';

const urlsToCache = [
  // Core HTML Shell
  '/Holliday-Lawn-Garden/',
  '/Holliday-Lawn-Garden/index.html',
  '/Holliday-Lawn-Garden/login.html',
  '/Holliday-Lawn-Garden/admin.html',
  '/Holliday-Lawn-Garden/customer-dashboard.html',
  '/Holliday-Lawn-Garden/manifest.json',
  '/Holliday-Lawn-Garden/offline.html',

  // Core CSS
  '/Holliday-Lawn-Garden/style.css',
  '/Holliday-Lawn-Garden/modern-styles.css',

  // Core JS
  '/Holliday-Lawn-Garden/firebase-config.js',
  '/Holliday-Lawn-Garden/firebase-init.js',
  '/Holliday-Lawn-Garden/login.js',
  '/Holliday-Lawn-Garden/admin-functions.js',
  '/Holliday-Lawn-Garden/customer-dashboard.js',
  '/Holliday-Lawn-Garden/utils.js',
  '/Holliday-Lawn-Garden/errorHandler.js',

  // Additional JS Modules
  '/Holliday-Lawn-Garden/equipment-manager.js',
  '/Holliday-Lawn-Garden/loyalty-program.js',
  '/Holliday-Lawn-Garden/material-tracker.js',
  '/Holliday-Lawn-Garden/bidding-system.js',
  '/Holliday-Lawn-Garden/sustainability-tracker.js',
  '/Holliday-Lawn-Garden/route-optimizer.js',
  '/Holliday-Lawn-Garden/payment-handler.js',

  // Assets
  '/Holliday-Lawn-Garden/icons/icon-192.png',
  '/Holliday-Lawn-Garden/icons/icon-512.png',
  '/Holliday-Lawn-Garden/Hollidays_Lawn_Garden_Logo.png',
  '/Holliday-Lawn-Garden/assets/hero-garden-landscaping.jpg',

  // Firebase SDKs (for offline support)
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics-compat.js'
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
      .catch(err => {
        console.error('❌ Error caching assets:', err);
        // Continue installation even if caching fails
        return Promise.resolve();
      })
  );
});

// ACTIVATE: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => 
        Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              console.log(`🧹 Deleting old cache: ${key}`);
              return caches.delete(key);
            }
          })
        )
      ),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// FETCH: Network-first strategy with offline fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase API calls (let Firebase handle its own caching)
  if (event.request.url.includes('firestore.googleapis.com')) return;
  if (event.request.url.includes('www.googleapis.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(async () => {
        // Try cache first on network failure
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // Show offline page for navigation requests
        if (event.request.mode === 'navigate') {
          const cache = await caches.open(CACHE_NAME);
          return cache.match(OFFLINE_URL);
        }

        // Return offline response for other requests
        return new Response(
          `Resource not available offline: ${event.request.url}`,
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          }
        );
      })
  );
});
