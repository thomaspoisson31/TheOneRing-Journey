// js/core/app.js

App.core = (function() {

    function preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Image preloaded: ${url}`);
                resolve();
            };
            img.onerror = () => {
                console.error(`❌ Failed to preload image: ${url}`);
                reject(new Error(`Failed to load image: ${url}`));
            };
            img.src = url;
        });
    }

    function initialize() {
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

        App.api.auth.checkError();

        Promise.all([
            App.features.locations.loadInitial(),
            App.features.regions.loadFromLocal(),
            App.features.seasons.loadSaved(),
            App.features.maps.loadData(),
            preloadImage(AppConfig.PLAYER_MAP_URL)
        ]).then(() => {
            App.ui.filters.setup();
            App.api.auth.checkStatus();

            DOM.mapImage.src = AppConfig.PLAYER_MAP_URL;

            DOM.mapImage.onload = () => {
                clearTimeout(startTimeout);
                App.features.maps.initialize();
            };

            App.ui.main.setupEventListeners();
            App.ui.modals.setupEventListeners();
        })
        .catch(error => {
            clearTimeout(startTimeout);
            console.error("❌ Error during app startup:", error);
            DOM.loaderOverlay.innerHTML = `<div class="text-2xl text-red-500">Startup Error.</div>`;
        });
    }

    return {
        initialize
    };
})();

document.addEventListener('DOMContentLoaded', App.core.initialize);