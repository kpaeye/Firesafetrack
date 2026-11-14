
/* FireSafe Track PWA registration */

if (
    "serviceWorker" in navigator &&
    (location.protocol === "https:" || location.hostname === "localhost")
) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register(
                "./firesafe-sw.js",
                { scope: "./" }
            );

            console.log(
                "FireSafe Track PWA registered:",
                registration.scope
            );

        } catch (error) {
            console.error(
                "FireSafe Track PWA registration failed:",
                error
            );
        }
    });
}
