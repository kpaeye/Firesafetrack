
/* =====================================================
   FIRESAFE TRACK - PWA SERVICE WORKER
   Version 3
===================================================== */

const CACHE_NAME = "firesafe-track-app-v4";

const APP_FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./dashboard.html",
    "./inspections.html",
    "./equipment.html",
    "./equipment-types.html",
    "./locations.html",
    "./deviations.html",
    "./corrective-actions.html",
    "./reports.html",
    "./users.html",
    "./settings.html",
    "./icons/firesafe-icon-192.svg",
    "./icons/firesafe-icon-512.svg"

];

const SDK_URL =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

/* =====================================================
   INSTALL
===================================================== */

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);

        for (const file of APP_FILES) {
            try {
                const response = await fetch(file, {
                    cache: "reload"
                });

                if (response.ok) {
                    await cache.put(file, response);
                }
            } catch (error) {
                console.warn("Could not cache:", file);
            }
        }

        try {
            const request = new Request(SDK_URL, {
                mode: "no-cors"
            });

            const response = await fetch(request);

            if (response.ok || response.type === "opaque") {
                await cache.put(request, response);
            }
        } catch (error) {
            console.warn("Supabase SDK cache unavailable.");
        }

        await self.skipWaiting();
    })());
});

/* =====================================================
   ACTIVATE
===================================================== */

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();

        await Promise.all(
            keys
                .filter(key =>
                    key.startsWith("firesafe-track-") &&
                    key !== CACHE_NAME
                )
                .map(key => caches.delete(key))
        );

        await self.clients.claim();
    })());
});

/* =====================================================
   FETCH
===================================================== */

self.addEventListener("fetch", event => {

    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    /* Never intercept Supabase API or authentication requests. */
    if (
        url.hostname.endsWith(".supabase.co") ||
        url.hostname.includes("supabase")
    ) {
        return;
    }

    const isSdk =
        url.origin === "https://cdn.jsdelivr.net" &&
        url.pathname.includes("@supabase/supabase-js");

    const isLocal = url.origin === self.location.origin;

    if (!isLocal && !isSdk) return;

    /* PAGE NAVIGATION: NETWORK FIRST */
    if (request.mode === "navigate") {

        event.respondWith((async () => {

            const cache = await caches.open(CACHE_NAME);

            try {
                const response = await fetch(request);

                if (response.ok) {
                    await cache.put(request, response.clone());
                }

                return response;

            } catch (error) {

                const cached = await caches.match(request, {
                    ignoreSearch: true
                });

                if (cached) return cached;

                const page = url.pathname.split("/").pop();

                if (page) {
                    const fallback = await cache.match("./" + page);
                    if (fallback) return fallback;
                }

                const index = await cache.match("./index.html");

                if (index) return index;

                return new Response(
                    "FireSafe Track is not available offline. Connect to the internet and open the application first.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain"
                        }
                    }
                );
            }

        })());

        return;
    }

    /* STATIC FILES AND SDK: CACHE FIRST */

    event.respondWith((async () => {

        const cache = await caches.open(CACHE_NAME);

        const cached = await cache.match(request);

        if (cached) return cached;

        try {
            const response = await fetch(request);

            if (
                response &&
                (response.ok || response.type === "opaque")
            ) {
                await cache.put(request, response.clone());
            }

            return response;

        } catch (error) {

            const fallback = await cache.match(request, {
                ignoreSearch: true
            });

            if (fallback) return fallback;

            throw error;
        }

    })());
});
