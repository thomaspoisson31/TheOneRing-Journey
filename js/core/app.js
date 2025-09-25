// js/core/app.js

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

    Promise.all([
        loadInitialLocations(),
        loadRegionsFromLocal(),
        loadSavedSeason(),
        loadMapsData(),
        preloadImage(AppConfig.PLAYER_MAP_URL)
    ]).then(() => {
            setupFilters();
            checkAuthStatus();

            // L'image est déjà pré-chargée, on peut l'assigner directement
            DOM.mapImage.src = AppConfig.PLAYER_MAP_URL;

            // Attendre que l'image soit effectivement dessinée par le navigateur
            DOM.mapImage.onload = () => {
                clearTimeout(startTimeout);
                initializeMap();
            };

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