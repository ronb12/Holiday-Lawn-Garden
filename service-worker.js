const CACHE_NAME = 'holliday-lawn-garden-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/modern-styles.css',
  '/variables.css',
  '/firebase-config.js',
  '/firebase-init.js',
  '/recaptcha-config.js',
  '/Hollidays_Lawn_Garden_Logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Firebase SDKs to cache
const FIREBASE_SDKS = [
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-performance-compat.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache Firebase SDKs
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Caching Firebase SDKs');
        return cache.addAll(FIREBASE_SDKS);
      })
    ])
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event with Cache-First Strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Determine which cache to use
            const cacheName = STATIC_ASSETS.includes(event.request.url) ? STATIC_CACHE : DYNAMIC_CACHE;

            caches.open(cacheName)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
   