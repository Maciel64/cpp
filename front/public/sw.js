/* Receipt Capture PWA — manual service worker (ponytail: sem @serwist/precache build; add se precisar de precache de rotas dinâmicas) */
const SHELL_CACHE = "cpp-shell-v1";
const STATIC_CACHE = "cpp-static-v2";
const STATIC_RX = /^\/(_next\/static\/|icons\/)/;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.add("/")));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== STATIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return hit || res;
}

async function networkFirstNav(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put("/", res.clone());
    return res;
  } catch {
    const cached = await cache.match("/");
    if (cached) return cached;
    return new Response("Offline", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // API em outro host (Elysia) fica de fora
  if (req.mode === "navigate") {
    event.respondWith(networkFirstNav(req));
    return;
  }
  if (STATIC_RX.test(url.pathname)) event.respondWith(staleWhileRevalidate(req));
});
