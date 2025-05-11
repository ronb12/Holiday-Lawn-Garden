const CACHE_NAME = 'holliday-lawn-cache-v3'; // ✅ Bumped version

const urlsToCache = [
  'index.html',
  'admin.html',
  'style.css',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'Hollidays_Lawn_Garden_Logo.png'
];

// ✅ INSTALL: Cache core assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Force activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching core assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('❌ Error during cache install:', err);
      })
  );
});

// ✅ ACTIVATE: Remove old caches
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

// ✅ FETCH: Cache-first with HTML fallback
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .catch(() => {
            // Offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return new Response(`
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><title>Offline</title></head>
                <body style="font-family:sans-serif;text-align:center;padding:2em;">
                  <h1>🔌 Offline</h1>
                  <p>This page is not available while offline.</p>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            }
          });
      })
  );
});
