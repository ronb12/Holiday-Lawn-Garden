const CACHE_NAME = 'holliday-lawn-cache-v3'; // 🔁 Bumped cache version

const urlsToCache = [
  'index.html',
  'admin.html',
  'style.css',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'Hollidays_Lawn_Garden_Logo.png'
];

// ✅ INSTALL EVENT: Cache core assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate this SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('❌ Error caching assets:', err);
      })
  );
});

// ✅ ACTIVATE EVENT: Clean old caches
self.addEventListener('activate', event => {
  const keepCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (!keepCaches.includes(key)) {
            console.log(`🧹 Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ✅ FETCH EVENT: Cache-first strategy with fallback + error handling
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(err => {
          console.warn('⚠️ Fetch failed; serving fallback HTML', err);
          return new Response(
            '<h1>Offline</h1><p>This page is not available offline.</p>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
    })
  );
});
