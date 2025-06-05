// Service Worker Version
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `holliday-lawn-garden-${CACHE_VERSION}`;
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
  '/Holliday-Lawn-Garden/assets/hero-garden-landscaping.jpg'
];

// INSTALL: Cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Error caching assets:', error);
        throw error;
      })
  );
});

// ACTIVATE: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('holliday-lawn-garden-') && name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => {
        console.log('Old caches removed');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('Error cleaning old caches:', error);
        throw error;
      })
  );
});

// FETCH: Improved caching strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase and other API calls
  if (event.request.url.includes('googleapis.com')) return;
  if (event.request.url.includes('firebaseio.com')) return;
  if (event.request.url.includes('firestore.')) return;

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Handle asset requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response and update cache in background
          fetch(event.request)
            .then(response => {
              if (response.ok) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, response));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // If not in cache, try network
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Return offline response for failed requests
            return new Response(
              'Resource not available offline',
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              }
            );
      });
    })
  );
});

// Handle skip waiting
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
