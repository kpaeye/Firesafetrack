/* FireSafe Track offline app-shell cache. Keep this file beside inspections.html. */
const CACHE_NAME = "firesafe-track-inspections-v1";
const APP_SHELL = ["./", "./inspections.html"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => Promise.resolve()));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("firesafe-track-") && key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET") return;
  const url = new URL(request.url);
  const isSupabaseSdk = url.hostname === "cdn.jsdelivr.net" && url.pathname.includes("@supabase/supabase-js");
  if(url.origin !== self.location.origin && !isSupabaseSdk) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if(cached) return cached;
    try {
      const response = await fetch(request);
      if(response && (response.ok || response.type === "opaque")) {
        try { await cache.put(request, response.clone()); } catch(cacheError) { /* Some browser responses cannot be cached. */ }
      }
      return response;
    } catch(error) {
      const fallback = await cache.match(request);
      if(fallback) return fallback;
      if(url.origin === self.location.origin) {
        const app = await cache.match("./inspections.html");
        if(app) return app;
      }
      throw error;
    }
  })());
});
