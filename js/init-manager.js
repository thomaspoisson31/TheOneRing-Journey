
/**
 * Gestionnaire d'initialisation et de configuration de l'application
 */
class InitManager {
    constructor() {
        this.MAP_WIDTH = 0;
        this.MAP_HEIGHT = 0;
        this.MAP_DISTANCE_MILES = 1150;
        this.PLAYER_MAP_URL = "fr_tor_2nd_eriadors_map_page-0001.webp";
        this.LOREMASTER_MAP_URL = "fr_tor_2nd_eriadors_map_page_loremaster.webp";
        this.LOCATIONS_URL = "Landmarks1.json";
    }

    /**
     * Démarre l'application
     */
    async startApp() {
        console.log("🚀 Starting application...");

        // Ajouter un timeout global pour éviter les chargements infinis
        const startTimeout = setTimeout(() => {
            if (loaderOverlay && loaderOverlay.style.display !== 'none') {
                console.error("❌ Application startup timed out");
                loaderOverlay.innerHTML = `<div class="text-2xl text-red-500 text-center p-4">
                    <i class="fas fa-exclamation-triangle mb-4 text-4xl"></i><br>
                    Temps de chargement dépassé.<br>
                    <span class="text-sm text-gray-400 mt-2">Vérifiez votre connexion et les fichiers requis.</span><br>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Recharger</button>
                </div>`;
            }
        }, 30000); // 30 secondes timeout

        try {
            // Vérifier les erreurs d'authentification dans l'URL
            checkAuthError();

            await this.loadInitialLocations();
            loadRegionsFromLocal();
            loadSavedContexts();
            setupFilters();
            loadSavedSeason(); // Load season at startup
            loadMapsData(); // Load maps data at startup
            logAuth("Initialisation de l'authentification...");

            // Initialize authentication after a short delay to ensure DOM is ready
            setTimeout(() => {
                checkGoogleAuth();
            }, 100);

            if (mapImage) {
                mapImage.onload = () => {
                    clearTimeout(startTimeout);
                    this.initializeMap();
                };
                mapImage.addEventListener('error', () => {
                    clearTimeout(startTimeout);
                    this.handleImageError();
                });

                console.log("🗺️ Loading map image:", this.PLAYER_MAP_URL);
                mapImage.src = this.PLAYER_MAP_URL;
            }

            if (infoBoxClose) {
                infoBoxClose.addEventListener('click', hideInfoBox);
            }

            logAuth("Configuration des event listeners d'authentification...");

            // Setup authentication event listeners
            setupAuthEventListeners();

            // Setup settings event listeners
            setupSettingsEventListeners();

            // Test des éléments DOM après un délai
            setTimeout(() => {
                logAuth("=== TEST DES ÉLÉMENTS DOM ===");
                logAuth("authModal element:", !!document.getElementById('auth-modal'));
                logAuth("auth-btn element:", !!document.getElementById('auth-btn'));
                logAuth("close-auth-modal element:", !!document.getElementById('close-auth-modal'));
                logAuth("google-signin-btn element:", !!document.getElementById('google-signin-btn'));
                logAuth("save-context-btn element:", !!document.getElementById('save-context-btn'));
                logAuth("settings-btn element:", !!document.getElementById('settings-btn'));
                logAuth("settings-modal element:", !!document.getElementById('settings-modal'));
                logAuth("close-settings-modal element:", !!document.getElementById('close-settings-modal'));

                const testAuthBtn = document.getElementById('auth-btn');
                if (testAuthBtn) {
                    logAuth("Bouton auth visible:", testAuthBtn.offsetParent !== null);
                    logAuth("Bouton auth cliquable:", !testAuthBtn.disabled);
                    logAuth("Classes du bouton auth:", testAuthBtn.className);
                }
                logAuth("=== FIN TEST DES ÉLÉMENTS DOM ===");
            }, 2000);

        } catch (error) {
            clearTimeout(startTimeout);
            console.error("❌ Error during app startup:", error);
            if (loaderOverlay) {
                loaderOverlay.innerHTML = `<div class="text-2xl text-red-500 text-center p-4">
                    <i class="fas fa-exclamation-triangle mb-4 text-4xl"></i><br>
                    Erreur lors du démarrage.<br>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Recharger</button>
                </div>`;
            }
        }

        // Region modal handlers avec vérification null
        const confirmAddRegionBtn = document.getElementById('confirm-add-region');
        const cancelAddRegionBtn = document.getElementById('cancel-add-region');

        if (confirmAddRegionBtn) {
            confirmAddRegionBtn.addEventListener('click', saveRegion);
        }

        if (cancelAddRegionBtn) {
            cancelAddRegionBtn.addEventListener('click', () => {
                if (addRegionModal) {
                    addRegionModal.classList.add('hidden');
                }
                cancelRegionCreation();
            });
        }

        // Double-click to complete region
        if (viewport) {
            viewport.addEventListener('dblclick', (event) => {
                if (isAddingRegionMode && currentRegionPoints.length >= 3) {
                    event.preventDefault();
                    completeRegion();
                }
            });
        }
    }

    /**
     * Charge les lieux initiaux
     */
    async loadInitialLocations() {
        console.log("Attempting to load locations...");
        const savedData = localStorage.getItem('middleEarthLocations');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                if (parsedData && Array.isArray(parsedData.locations)) {
                   locationsData = parsedData;
                   console.log("✅ Success: Loaded saved locations from localStorage.");
                   return;
                }
            } catch (e) {
                console.error("Failed to parse saved locations, will fetch from URL.", e);
            }
        }

        console.log("No valid saved data found. Fetching from URL:", this.LOCATIONS_URL);
        try {
            // Ajouter un timeout pour éviter les attentes infinies
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

            const response = await fetch(this.LOCATIONS_URL, {
                signal: controller.signal,
                cache: 'no-cache' // Éviter les problèmes de cache
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data && Array.isArray(data.locations)) {
                locationsData = data;
                console.log("✅ Success: Loaded default locations from URL.");
                saveLocationsToLocal();
            } else {
                throw new Error("Invalid JSON structure from URL");
            }
        } catch (error) {
            console.error("❌ Error fetching locations from URL, using empty list as fallback.", error);
            if (error.name === 'AbortError') {
                console.error("Request timed out after 10 seconds");
            }
            locationsData = this.getDefaultLocations();
            // Sauvegarder même la liste vide pour éviter les futures tentatives de chargement
            saveLocationsToLocal();
        }
    }

    /**
     * Initialise la carte
     */
    initializeMap() {
        console.log("🗺️ Initializing map...");
        if (mapImage.naturalWidth === 0) {
            console.warn("⚠️ Map image not loaded yet, retrying...");
            return;
        }

        console.log("📐 Map dimensions:", mapImage.naturalWidth, "x", mapImage.naturalHeight);
        this.MAP_WIDTH = mapImage.naturalWidth;
        this.MAP_HEIGHT = mapImage.naturalHeight;
        MAP_WIDTH = this.MAP_WIDTH;
        MAP_HEIGHT = this.MAP_HEIGHT;
        
        mapContainer.style.width = `${this.MAP_WIDTH}px`;
        mapContainer.style.height = `${this.MAP_HEIGHT}px`;
        drawingCanvas.width = this.MAP_WIDTH;
        drawingCanvas.height = this.MAP_HEIGHT;
        regionsLayer.setAttribute('width', this.MAP_WIDTH);
        regionsLayer.setAttribute('height', this.MAP_HEIGHT);
        regionsLayer.setAttribute('viewBox', `0 0 ${this.MAP_WIDTH} ${this.MAP_HEIGHT}`);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        renderLocations();
        renderRegions();
        requestAnimationFrame(() => {
            resetView();
            mapImage.classList.remove('opacity-0');
            loaderOverlay.style.opacity = '0';
            setTimeout(() => { loaderOverlay.style.display = 'none'; }, 500);
        });
        preloadLoremasterMap();
        console.log("✅ Map initialized successfully");
    }

    /**
     * Gère les erreurs de chargement d'image
     */
    handleImageError() {
        console.error("❌ Erreur de chargement de l'image de carte");
        loaderOverlay.innerHTML = `<div class="text-2xl text-red-500 text-center p-4"><i class="fas fa-exclamation-triangle mb-4 text-4xl"></i><br>Erreur de chargement de la carte.<br><span class="text-sm text-gray-400 mt-2">Vérifiez que les fichiers de carte sont disponibles.</span></div>`;
    }

    /**
     * Attendre qu'un élément apparaisse dans le DOM
     */
    waitForElement(selector, callback, maxWait = 5000) {
        const startTime = Date.now();

        function check() {
            const element = document.querySelector(selector);
            if (element) {
                callback(element);
            } else if (Date.now() - startTime < maxWait) {
                setTimeout(check, 100);
            } else {
                logAuth("TIMEOUT: Élément non trouvé:", selector);
            }
        }

        check();
    }

    /**
     * Retourne les lieux par défaut
     */
    getDefaultLocations() {
        return { "locations": [] }; // Fallback to empty if fetch fails
    }

    /**
     * Retourne les régions par défaut
     */
    getDefaultRegions() {
        return { "regions": [] };
    }
}

// Créer une instance globale du gestionnaire d'initialisation
window.initManager = new InitManager();

// Fonction globale pour démarrer l'application (compatibilité)
function startApp() {
    return window.initManager.startApp();
}

function loadInitialLocations() {
    return window.initManager.loadInitialLocations();
}

function initializeMap() {
    return window.initManager.initializeMap();
}

function handleImageError() {
    return window.initManager.handleImageError();
}

function waitForElement(selector, callback, maxWait) {
    return window.initManager.waitForElement(selector, callback, maxWait);
}

function getDefaultLocations() {
    return window.initManager.getDefaultLocations();
}

function getDefaultRegions() {
    return window.initManager.getDefaultRegions();
}
