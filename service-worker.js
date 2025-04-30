const CACHE_NAME = 'holliday-lawn-cache-v2'; // Updated to bust old cache
const urlsToCache = [
  'index.html',
  'style.css',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'Hollidays_Lawn_Garden_Logo.png'
];

// Install event: cache core files
self.addEventListener('install', event => {
  self.skipWaiting(); // 🔄 Activate this service worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching assets');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event: clean up old caches and claim control
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (!cacheWhitelist.includes(key)) {
            console.log(`🧹 Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim()) // 🚀 Take control of all tabs immediately
  );
});

// Fetch event: serve from cache first, then fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    ).catch(() =>
      caches.match('index.html') // Fallback for offline use
    )
  );
});
