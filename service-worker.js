const CACHE_NAME = 'holliday-lawn-cache-v3';

const urlsToCache = [
  'index.html',
  'admin.html',
  'style.css',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'Hollidays_Lawn_Garden_Logo.png'
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
