const CACHE_NAME = 'holliday-lawn-garden-v1';
const ASSETS_TO_CACHE = [
  '/Holliday-Lawn-Garden/',
  '/Holliday-Lawn-Garden/index.html',
  '/Holliday-Lawn-Garden/assets/css/main.css',
  '/Holliday-Lawn-Garden/assets/js/main.js',
  '/Holliday-Lawn-Garden/assets/images/favicon/favicon-16x16.png',
  '/Holliday-Lawn-Garden/assets/images/favicon/favicon-32x32.png',
  '/Holliday-Lawn-Garden/assets/images/favicon/apple-touch-icon.png',
  '/Holliday-Lawn-Garden/assets/images/favicon/android-chrome-192x192.png',
  '/Holliday-Lawn-Garden/assets/images/favicon/android-chrome-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('Cache initialization failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});
