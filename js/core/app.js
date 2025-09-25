// js/core/app.js

function initializeApp() {
    window.addEventListener('unhandledrejection', (event) => {
        console.error('⚠️ Unhandled promise rejection:', event.reason);
    });
    window.addEventListener('error', (event) => {
        console.error('⚠️ JavaScript error:', event.error);
    });

    console.log('🚀 Starting application...');

    const startTimeout = setTimeout(() => {
        if (DOM.loaderOverlay.style.display !== 'none') {
            console.error("❌ Application startup timed out");
            DOM.loaderOverlay.innerHTML = `<div class="text-2xl text-red-500">Timeout. <button onclick="location.reload()">Reload</button></div>`;
        }
    }, 30000);

    checkAuthError();

    Promise.all([loadInitialLocations(), loadRegionsFromLocal(), loadSavedSeason(), loadMapsData()])
        .then(() => {
            setupFilters();
            checkAuthStatus();

            DOM.mapImage.onload = () => {
                clearTimeout(startTimeout);
                initializeMap();
            };
            DOM.mapImage.onerror = () => {
                clearTimeout(startTimeout);
                console.error("❌ Map image failed to load.");
                DOM.loaderOverlay.innerHTML = `<div class="text-2xl text-red-500">Map failed to load.</div>`;
            };

            console.log("🗺️ Loading map image:", AppConfig.PLAYER_MAP_URL);
            DOM.mapImage.src = AppConfig.PLAYER_MAP_URL;

            setupMainUIEventListeners();
            setupModalEventListeners();
        })
        .catch(error => {
            clearTimeout(startTimeout);
            console.error("❌ Error during app startup:", error);
            DOM.loaderOverlay.innerHTML = `<div class="text-2xl text-red-500">Startup Error.</div>`;
        });
}

document.addEventListener('DOMContentLoaded', initializeApp);