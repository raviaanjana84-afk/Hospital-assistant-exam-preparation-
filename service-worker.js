// ==========================================
// SERVICE WORKER — offline caching for PWA
// ==========================================
const CACHE_NAME = "acharya-app-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./config.js",
  "./main.js",
  "./auth.js",
  "./booking.js",
  "./mala.js",
  "./hawan.js",
  "./pujan.js",
  "./kundli.js",
  "./mantra.js",
  "./quiz.js",
  "./bhakti-ai.js",
  "./admin.js",
  "./manifest.json"
];

// Install: cache core app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for Firebase/API calls, cache-first for app shell
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Never cache Firebase, Gemini, or other external API calls — always go to network
  if (
    url.includes("firebaseio.com") ||
    url.includes("googleapis.com") ||
    url.includes("firestore") ||
    url.includes("wa.me") ||
    event.request.method !== "GET"
  ) {
    return; // let it pass through to network normally
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((response) => {
          // Cache new same-origin requests on the fly
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
      );
    }).catch(() => caches.match("./index.html"))
  );
});

