/* FireSafe Track application-shell service worker.
   Place beside the HTML pages at the website root and serve over HTTPS. */
const CACHE_NAME = "firesafe-track-app-v2";
const APP_PAGES = [
  "./dashboard.html",
  "./inspections.html",
  "./equipment.html",
  "./equipment-types.html",
  "./locations.html",
  "./deviations.html",
  "./corrective-actions.html",
  "./reports.html",
  "./users.html",
  "./settings.html"
];
const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

async function cacheSameOriginPage(path) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(path, { cache: "reload" });
    if (response && response.ok) await cache.put(path, response.clone());
  } catch (_) {
    // Keep installing even if one optional page is missing/unreachable.
  }
}

async function cacheSupabaseSdk() {
  const cache = await caches.open(CACHE_NAME);
  try {
    // Classic cross-origin scripts can be cached as opaque responses.
    const request = new Request(SDK_URL, { mode: "no-cors", cache: "reload" });
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) {
      await cache.put(request, response.clone());
    }
  } catch (_) {
    // The app shell must still install if the CDN is temporarily unavailable.
  }
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    await Promise.all(APP_PAGES.map(cacheSameOriginPage));
    await cacheSupabaseSdk();
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith("firesafe-track-") && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isSdk = url.origin === "https://cdn.jsdelivr.net" && url.pathname.includes("@supabase/supabase-js");
  if (url.origin !== self.location.origin && !isSdk) return;

  // For page navigation: try the network first, but serve the saved page offline.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response && response.ok) await cache.put(request, response.clone());
        return response;
      } catch (_) {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        const path = url.pathname.split("/").pop();
        const byPage = path ? await cache.match(`./${path}`) : null;
        if (byPage) return byPage;
        const dashboard = await cache.match("./dashboard.html");
        if (dashboard) return dashboard;
        const inspections = await cache.match("./inspections.html");
        if (inspections) return inspections;
        return new Response("<h1>FireSafe Track is not cached on this device yet</h1><p>Connect to the internet, open FireSafe Track once, and try again.</p>", {
          status: 503, headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
    })());
    return;
  }

  // Cache-first for the Supabase library and same-origin static resources.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === "opaque")) {
        try { await cache.put(request, response.clone()); } catch (_) {}
      }
      return response;
    } catch (error) {
      const fallback = await cache.match(request, { ignoreSearch: true });
      if (fallback) return fallback;
      throw error;
    }
  })());
});
