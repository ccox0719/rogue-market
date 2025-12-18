const CACHE_NAME = "rogue-market-cache-v1";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/graph-up-arrow.svg",
  "/favicon-32x32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
      )
  );
  self.clients.claim();
});

const cacheNavigationRequest = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cachedIndex = await cache.match("/index.html");

  const refresh = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put("/index.html", response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cachedIndex) {
    refresh.catch(() => {});
    return cachedIndex;
  }

  const networkResponse = await refresh;
  if (networkResponse) return networkResponse;

  return cachedIndex || Response.error();
};

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(cacheNavigationRequest(request));
    return;
  }

  const requestURL = new URL(request.url);
  if (requestURL.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        return cachedResponse;
      }
    })
  );
});
