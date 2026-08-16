/**
 * Selim HR - Service Worker
 * PWA support with offline caching
 */

const CACHE_NAME = "selim-hr-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
];

// Install — cache static assets
self.addEventListener("install", (event: any) => {
  console.log("[SW] Installing Selim HR Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      (self as any).skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener("activate", (event: any) => {
  console.log("[SW] Activating Selim HR Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      (self as any).clients.claim();
    })
  );
});

// Fetch — network first, cache fallback
self.addEventListener("fetch", (event: any) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API calls (let them go to network)
  if (request.url.includes("/api/")) {
    event.respondWith(fetch(request).catch(() => {
      // Return offline indicator for API calls
      return new Response(JSON.stringify({ offline: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }));
    return;
  }

  // Network first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});

// Push notifications
self.addEventListener("push", (event: any) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "Selim HR";
  const options = {
    body: data.body || "إشعار جديد",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    dir: "rtl" as const,
    lang: "ar",
    vibrate: [200, 100, 200],
    tag: data.tag || "default",
    requireInteraction: false,
    actions: [
      { action: "open", title: "فتح التطبيق" },
      { action: "dismiss", title: "إغلاق" },
    ],
    data: { url: data.url || "/" },
  };

  event.waitUntil(
    (self as any).registration.showNotification(title, options)
  );
});

// Notification click
self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const { action, data } = event.notification;

  if (action === "dismiss") return;

  event.waitUntil(
    (self as any).clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clients: any[]) => {
        const url = data?.url || "/";
        for (const client of clients) {
          if (client.url.includes((self as any).location.host) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if ((self as any).clients.openWindow) {
          return (self as any).clients.openWindow(url);
        }
      })
  );
});

// Background sync
self.addEventListener("sync", (event: any) => {
  if (event.tag === "attendance-sync") {
    console.log("[SW] Background sync: attendance");
    // Could sync pending attendance records here
  }
});
