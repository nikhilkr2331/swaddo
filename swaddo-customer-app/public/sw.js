self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Simple fetch handler to make the PWA installable.
  // It just passes through the requests without any caching.
  event.respondWith(fetch(event.request));
});
