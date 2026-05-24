const CACHE_NAME = "miso-hungry-v1";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    }),
  );
});

function readPushPayload(event) {
  if (!event.data) {
    return {};
  }

  try {
    return event.data.json();
  } catch {
    return {
      notification: {
        body: event.data.text(),
        title: "Miso Hungry",
      },
    };
  }
}

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "Miso Hungry";
  const body = notification.body || data.body || "";
  const url = data.href || data.url || "/notifications";

  event.waitUntil(
    self.registration.showNotification(title, {
      badge: "/icons/icon-192.png",
      body,
      data: { url },
      icon: notification.icon || data.icon || "/icons/icon-192.png",
      tag: data.notificationId || data.recipeId || undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url || "/notifications";
  const url = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((clients) => {
        const existingClient = clients.find((client) => client.url === url);

        if (existingClient) {
          return existingClient.focus();
        }

        return self.clients.openWindow(url);
      }),
  );
});
