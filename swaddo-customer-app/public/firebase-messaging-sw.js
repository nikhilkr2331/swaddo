importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// IMPORTANT: These values need to be manually replaced by the user after Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyBM8cWMeSbfQR9vg4G3DAitKSn1ABifKY4",
  authDomain: "swaddo-pwa.firebaseapp.com",
  projectId: "swaddo-pwa",
  storageBucket: "swaddo-pwa.firebasestorage.app",
  messagingSenderId: "1083737771617",
  appId: "1:1083737771617:web:2319df7e88ab29481c2420",
  measurementId: "G-1W29CB12K2"
};

// Check if valid config before initializing to prevent crashes in local dev
if (firebaseConfig.apiKey !== "REPLACE_ME") {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        click_action: payload.data?.click_action || '/'
      },
      vibrate: [200, 100, 200, 100, 200, 100, 200]
    };
  
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

  self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    event.notification.close();
    
    const clickAction = event.notification.data?.click_action || '/';
    const targetUrl = new URL(clickAction, self.location.origin).href;

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  });
}
}

// --- PWA Offline Fallback Strategy ---
const CACHE_NAME = 'swaddo-offline-v3';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Ensure the offline page is cached
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear old caches to ensure the app updates
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('swaddo-offline')) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      
      // Enable navigation preload if it's supported
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
    })()
  );
  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // We only want to handle navigation requests (e.g. HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported.
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          // Always try the network first.
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // catch is only triggered if an exception is thrown, which is likely
          // due to a network error.
          // If fetch did fail, return the cached offline page.
          console.log('[Service Worker] Fetch failed; returning offline page instead.', error);

          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
  }
});
