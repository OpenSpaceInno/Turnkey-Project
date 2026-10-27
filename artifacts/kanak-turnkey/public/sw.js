// Kanak Turnkey — Service Worker for Mobile PWA & Offline Support
const CACHE_NAME = "kanak-turnkey-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/pwa-icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon.svg"
];

// Install: Cache essential app shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Cache preload warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up older cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Smart network-first / cache-fallback strategy
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET requests (POST/PUT/DELETE handled by app offline queue)
  if (req.method !== "GET") {
    return;
  }

  // Handle API GET requests (network-first, cache fallback)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, clone);
            });
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) {
            return cached;
          }
          return new Response(JSON.stringify({ offline: true, error: "Network unavailable" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        })
    );
    return;
  }

  // Handle SPA navigation requests (return cached index.html if offline)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cachedIndex = await caches.match("/index.html");
        return cachedIndex || caches.match("/");
      })
    );
    return;
  }

  // Static assets (CSS, JS, Fonts, Images)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Return cached and refresh in background
        fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes));
            }
          })
          .catch(() => {});
        return cached;
      }

      return fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200 && (url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith(".svg") || url.pathname.endsWith(".png") || url.pathname.endsWith(".woff2"))) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => {
          return new Response("", { status: 404 });
        });
    })
  );
});
