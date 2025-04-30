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
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching assets');
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event: respond from cache or fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Serve from cache if found, else fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Optionally return fallback page or image here if offline
        return caches.match('index.html'); // or create offline.html
      })
  );
});

// Activate event: clean up old caches
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
    )
  );
});
