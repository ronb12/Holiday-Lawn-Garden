const CACHE_NAME = 'holiday-lawn-garden-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Base path for GitHub Pages
const BASE_PATH = '/Holliday-Lawn-Garden';

// Assets to cache
const STATIC_ASSETS = [
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/about.html`,
  `${BASE_PATH}/contact.html`,
  `${BASE_PATH}/services.html`,
  `${BASE_PATH}/gallery.html`,
  `${BASE_PATH}/pay-your-bill.html`,
  `${BASE_PATH}/login.html`,
  `${BASE_PATH}/admin-login.html`,
  `${BASE_PATH}/admin.html`,
  `${BASE_PATH}/modern-styles.css`,
  `${BASE_PATH}/variables.css`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/assets/hollidays-logo.png`,
  `${BASE_PATH}/assets/hero-garden-landscaping.jpg`,
  `${BASE_PATH}/js/firebase-config.js`,
  `${BASE_PATH}/js/firebase-init.js`
];

// Firebase SDKs to cache
const FIREBASE_SDKS = [
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics-compat.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache static assets
        const staticPromises = STATIC_ASSETS.map(url => 
          cache.add(url).catch(error => {
            console.warn(`Failed to cache ${url}:`, error);
            return Promise.resolve(); // Continue even if one asset fails
          })
        );

        // Cache Firebase SDKs
        const sdkPromises = FIREBASE_SDKS.map(url =>
          cache.add(url).catch(error => {
            console.warn(`Failed to cache ${url}:`, error);
            return Promise.resolve(); // Continue even if one SDK fails
          })
        );

        return Promise.all([...staticPromises, ...sdkPromises]);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
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

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Handle Firebase SDK requests with network-first strategy
  if (FIREBASE_SDKS.some(sdk => event.request.url.includes(sdk))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(error => {
              console.warn('Failed to cache Firebase SDK:', error);
            });
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Default cache-first strategy for other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Make network request
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.warn('Failed to cache response:', error);
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(`${BASE_PATH}/offline.html`);
            }
            throw error;
          });
      })
  );
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
   