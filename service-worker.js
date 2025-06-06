const CACHE_NAME = 'holliday-lawn-garden-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

const BASE_PATH = '/Holliday-Lawn-Garden';

// Assets to cache immediately
const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/about.html`,
  `${BASE_PATH}/services.html`,
  `${BASE_PATH}/contact.html`,
  `${BASE_PATH}/modern-styles.css`,
  `${BASE_PATH}/variables.css`,
  `${BASE_PATH}/js/main.js`,
  `${BASE_PATH}/js/firebase-config.js`,
  `${BASE_PATH}/js/firebase-init.js`,
  `${BASE_PATH}/js/auth.js`,
  `${BASE_PATH}/js/dashboard.js`,
  `${BASE_PATH}/assets/images/Hollidays_Lawn_Garden_Logo.png`,
  `${BASE_PATH}/assets/images/hero-bg.jpg`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`
];

// Firebase SDKs to cache
const FIREBASE_SDKS = [
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-storage.js',
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(DYNAMIC_CACHE).then(cache => cache.addAll(FIREBASE_SDKS))
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-service-requests') {
    event.waitUntil(syncServiceRequests());
  }
});

// Fetch event - handle different types of requests
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.includes(url.pathname) || FIREBASE_SDKS.includes(url.href)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle other requests with network-first strategy
  event.respondWith(handleOtherRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(API_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  return fetch(request);
}

// Handle other requests with network-first strategy
async function handleOtherRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Sync service requests with IndexedDB
async function syncServiceRequests() {
  const db = await openDB();
  const requests = await db.getAll('serviceRequests');
  
  for (const request of requests) {
    if (!request.synced) {
      try {
        const response = await fetch('/api/service-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        });

        if (response.ok) {
          request.synced = true;
          await db.put('serviceRequests', request);
        }
      } catch (error) {
        console.error('Error syncing service request:', error);
      }
    }
  }
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HollidayLawnGarden', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('serviceRequests')) {
        db.createObjectStore('serviceRequests', { keyPath: 'id' });
      }
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Holliday Lawn & Garden', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
   