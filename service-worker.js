const CACHE_NAME = 'holliday-lawn-cache-v2';
const urlsToCache = [
  'index.html',
  'admin.html',
  'style.css',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'Hollidays_Lawn_Garden_Logo.png'
];

// ✅ Install: cache files
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching assets');
      return cache.addAll(urlsToCache).catch(err => {
        console.error('❌ Cache addAll error:', err);
      });
    })
  );
});

// ✅ Activate: delete old caches
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
    ).then(() => self.clients.claim())
  );
});

// ✅ Fetch: try cache first, fallback to network, catch failures
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        return networkResponse;
      }).catch(err => {
        console.warn('⚠️ Network request failed:', err);
        // Fallback response to avoid TypeError
        return new Response('<h1>Offline</h1><p>The app is offline and the resource was not cached.</p>', {
          headers: { 'Content-Type': 'text/html' }
        });
      });
    })
  );
});
