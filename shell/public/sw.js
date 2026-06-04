const CACHE_NAME = 'chronicle-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/src/main.js',
  '/src/style.css',
  '/editorial_lead.png',
  '/video_cover.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@600;700;800&display=swap'
];

// Install Event - Pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching application shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Smart Routing & Offline fallback
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip POST and other non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // 1. Navigation requests (HTML files): Network-First, with Cache fallback to enable offline access
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Keep a fresh copy in cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback: serve /index.html
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 2. Micro-Frontend entry points (remoteEntry.js): Network-First to guarantee hot fixes load
  if (requestUrl.pathname.endsWith('remoteEntry.js')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 3. Fonts and Static Images: Cache-First (TTL handled or client bypass)
  if (
    requestUrl.origin.includes('fonts.gstatic.com') ||
    requestUrl.origin.includes('fonts.googleapis.com') ||
    requestUrl.pathname.endsWith('.png') ||
    requestUrl.pathname.endsWith('.svg') ||
    requestUrl.pathname.endsWith('.css') ||
    event.request.destination === 'image' ||
    requestUrl.pathname.match(/\.(jpg|jpeg|webp|gif|png|svg)($|\?)/i)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((response) => {
          if (response.status === 200 || response.status === 0) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 4. Default: Network-First with Cache fallback for general assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background Sync - Processes queued offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-subscriptions') {
    event.waitUntil(processOfflineSubscriptions());
  }
});

// Message Listener - Handles skipWaiting and notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Process subscription queue saved in LocalStorage (synchronized via Client script)
async function processOfflineSubscriptions() {
  console.log('[Service Worker] Restored connectivity: syncing offline actions');
  
  // Note: LocalStorage is not directly accessible inside Service Worker context.
  // In a full implementation, we retrieve items from IndexedDB.
  // The client script will trigger the API calls directly upon detecting window 'online' event,
  // making this sync handler act as a backup trigger.
}
