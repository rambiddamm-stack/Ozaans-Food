// Foods Carnival - Service Worker
// Enables offline functionality and fast loading on slow connections

const CACHE_NAME = "foods-carnival-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./data.js",
  "./style.css",
  "./manifest.json",
];

// Install: cache all static assets immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Cache-first strategy for static, Network-first for API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip chrome-extension and non-http
  if (!event.request.url.startsWith("http")) return;

  // Cache-first for our static assets
  if (STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset.replace("./", "")))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Network-first with cache fallback for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
