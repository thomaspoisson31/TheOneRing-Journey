
// --- Configuration et constantes ---
const CONFIG = {
    MAP: {
        DISTANCE_MILES: 1150,
        PLAYER_URL: "fr_tor_2nd_eriadors_map_page-0001.webp",
        LOREMASTER_URL: "fr_tor_2nd_eriadors_map_page_loremaster.webp"
    },
    FILES: {
        LOCATIONS_URL: "Landmarks1.json"
    },
    COLORS: {
        locations: { red: 'rgba(239, 68, 68, 0.8)', blue: 'rgba(59, 130, 246, 0.8)', green: 'rgba(34, 197, 94, 0.8)', violet: 'rgba(139, 92, 246, 0.8)', orange: 'rgba(252, 169, 3, 0.8)', black: 'rgba(17, 24, 39, 0.8)' },
        regions: { red: 'rgba(239, 68, 68, 0.15)', blue: 'rgba(59, 130, 246, 0.15)', green: 'rgba(34, 197, 94, 0.15)', violet: 'rgba(139, 92, 246, 0.15)', orange: 'rgba(252, 169, 3, 0.15)', black: 'rgba(17, 24, 39, 0.15)' }
    },
    JOURNEY: {
        PROXIMITY_DISTANCE: 50,
        MILES_PER_DAY: 20
    }
};

// --- État global de l'application ---
const AppState = {
    // Map state
    mapDimensions: { width: 0, height: 0 },
    transform: { scale: 1, panX: 0, panY: 0 },
    isPlayerView: true,
    
    // Interaction states
    modes: {
        isPanning: false,
        isDrawingMode: false,
        isDrawing: false,
        isAddingLocationMode: false,
        isAddingRegionMode: false
    },
    
    // Data
    locationsData: null,
    regionsData: { regions: [] },
    activeFilters: { known: false, visited: false, colors: [] },
    
    // Journey
    journey: {
        path: [],
        discoveries: [],
        totalPathPixels: 0,
        startPoint: null,
        lastPoint: null,
        traversedRegions: new Set(),
        nearbyLocations: new Set()
    },
    
    // Voyage segments
    voyage: {
        current: null,
        segments: [],
        currentSegmentIndex: 0,
        isActive: false,
        activatedSegments: new Set()
    },
    
    // UI state
    activeLocationId: null,
    newLocationCoords: null,
    dragState: {
        draggedMarker: null,
        startX: 0,
        startY: 0,
        startPanX: 0,
        startPanY: 0
    },
    
    // Region creation
    regionCreation: {
        currentPoints: [],
        tempPath: null
    },
    
    // Authentication
    auth: {
        googleUser: null,
        savedContexts: [],
        autoSyncEnabled: false,
        lastSyncTime: 0
    }
};

// --- Application principale ---
class MiddleEarthApp {
    constructor() {
        this.domElements = new DOMElements();
        this.mapManager = new MapManager(this.domElements);
        this.locationManager = new LocationManager(this.domElements);
        this.regionManager = new RegionManager(this.domElements);
        this.journeyManager = new JourneyManager(this.domElements);
        this.voyageManager = new VoyageManager(this.domElements);
        this.authManager = new AuthManager(this.domElements);
        this.filterManager = new FilterManager(this.domElements);
        this.uiManager = new UIManager(this.domElements);
        this.geminiManager = new GeminiManager(this.domElements);
        
        // Expose managers globally for backward compatibility
        window.mapManager = this.mapManager;
        window.locationManager = this.locationManager;
        window.regionManager = this.regionManager;
        window.journeyManager = this.journeyManager;
        window.voyageManager = this.voyageManager;
        window.authManager = this.authManager;
        window.filterManager = this.filterManager;
        window.uiManager = this.uiManager;
        window.geminiManager = this.geminiManager;
    }

    async init() {
        console.log("🚀 Starting application...");
        
        try {
            // Check auth error from URL first
            if (window.checkAuthError) {
                window.checkAuthError();
            }

            // Initialize components
            await this.locationManager.loadInitialData();
            this.regionManager.loadFromStorage();
            this.authManager.init();
            this.filterManager.init();
            this.voyageManager.init();
            this.geminiManager.init();
            
            // Setup map
            await this.mapManager.init();
            
            // Render initial state
            this.locationManager.render();
            this.regionManager.render();
            
            // Setup event listeners
            this.setupEventListeners();
            this.uiManager.setupEventListeners();
            
            console.log("✅ Application initialized successfully");
        } catch (error) {
            console.error("❌ Error during app startup:", error);
            this.handleStartupError(error);
        }
    }

    setupEventListeners() {
        // Mode buttons
        this.domElements.drawModeBtn.addEventListener('click', () => this.toggleDrawMode());
        this.domElements.addLocationBtn.addEventListener('click', () => this.toggleAddLocationMode());
        this.domElements.addRegionBtn.addEventListener('click', () => this.toggleAddRegionMode());
        this.domElements.eraseBtn.addEventListener('click', () => this.journeyManager.clearJourney());
        
        // Map interactions
        this.setupMapEventListeners();
        
        // UI interactions
        this.uiManager.setupEventListeners();
    }

    setupMapEventListeners() {
        // Viewport interactions - check if viewport exists
        if (!this.domElements.viewport) {
            console.error('❌ Cannot setup map event listeners: viewport not found');
            return;
        }

        this.domElements.viewport.addEventListener('mousedown', (e) => this.handleViewportMouseDown(e));
        this.domElements.viewport.addEventListener('mousemove', (e) => this.handleViewportMouseMove(e));
        this.domElements.viewport.addEventListener('mouseup', () => this.handleViewportMouseUp());
        this.domElements.viewport.addEventListener('mouseleave', () => this.handleViewportMouseLeave());
        this.domElements.viewport.addEventListener('wheel', (e) => this.handleWheel(e));
        this.domElements.viewport.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }

    toggleDrawMode() {
        this.resetOtherModes();
        AppState.modes.isDrawingMode = !AppState.modes.isDrawingMode;
        this.updateModeUI('drawing');
        this.mapManager.updatePointerEvents();
        this.locationManager.render();
    }

    toggleAddLocationMode() {
        this.resetOtherModes();
        AppState.modes.isAddingLocationMode = !AppState.modes.isAddingLocationMode;
        this.updateModeUI('location');
        this.locationManager.render();
    }

    toggleAddRegionMode() {
        this.resetOtherModes();
        AppState.modes.isAddingRegionMode = !AppState.modes.isAddingRegionMode;
        this.updateModeUI('region');
        if (!AppState.modes.isAddingRegionMode) {
            this.regionManager.cancelCreation();
        }
        this.locationManager.render();
    }

    resetOtherModes() {
        AppState.modes.isDrawingMode = false;
        AppState.modes.isAddingLocationMode = false;
        AppState.modes.isAddingRegionMode = false;
        this.regionManager.cancelCreation();
    }

    updateModeUI(activeMode) {
        const modes = ['drawing', 'location', 'region'];
        modes.forEach(mode => {
            const btn = this.domElements[`${mode === 'drawing' ? 'drawMode' : mode === 'location' ? 'addLocation' : 'addRegion'}Btn`];
            const isActive = mode === activeMode && AppState.modes[`is${mode === 'drawing' ? 'Drawing' : mode === 'location' ? 'AddingLocation' : 'AddingRegion'}Mode`];
            btn.classList.toggle('btn-active', isActive);
            this.domElements.viewport.classList.toggle(`${mode === 'location' ? 'adding-location' : mode === 'region' ? 'adding-region' : 'drawing'}`, isActive);
        });
    }

    handleViewportMouseDown(event) {
        if (event.target.closest('.location-marker, #info-box')) return;
        this.uiManager.hideInfoBox();

        if (AppState.modes.isAddingLocationMode) {
            this.locationManager.addLocation(event);
            return;
        }

        if (AppState.modes.isAddingRegionMode) {
            this.regionManager.addPoint(event);
            return;
        }

        if (AppState.modes.isDrawingMode) {
            this.journeyManager.startDrawing(event);
            return;
        }

        // Start panning
        AppState.modes.isPanning = true;
        AppState.dragState.startPanX = event.clientX - AppState.transform.panX;
        AppState.dragState.startPanY = event.clientY - AppState.transform.panY;
        this.domElements.viewport.classList.add('panning');
    }

    handleViewportMouseMove(event) {
        if (AppState.modes.isPanning) {
            AppState.transform.panX = event.clientX - AppState.dragState.startPanX;
            AppState.transform.panY = event.clientY - AppState.dragState.startPanY;
            this.mapManager.applyTransform();
        } else if (AppState.modes.isDrawing) {
            this.journeyManager.continueDrawing(event);
        }
    }

    handleViewportMouseUp() {
        if (AppState.modes.isDrawing) {
            this.journeyManager.stopDrawing();
        }
        AppState.modes.isPanning = false;
        this.domElements.viewport.classList.remove('panning');
    }

    handleViewportMouseLeave() {
        this.handleViewportMouseUp();
    }

    handleWheel(event) {
        event.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = event.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        
        const rect = this.domElements.viewport.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        AppState.transform.panX = mouseX - (mouseX - AppState.transform.panX) * zoom;
        AppState.transform.panY = mouseY - (mouseY - AppState.transform.panY) * zoom;
        AppState.transform.scale = Math.max(0.1, Math.min(AppState.transform.scale * zoom, 5));
        
        this.mapManager.applyTransform();
    }

    handleDoubleClick(event) {
        if (AppState.modes.isAddingRegionMode && AppState.regionCreation.currentPoints.length >= 3) {
            event.preventDefault();
            this.regionManager.completeRegion();
        }
    }

    handleStartupError(error) {
        const loaderOverlay = this.domElements.loaderOverlay || document.getElementById('loader-overlay');
        if (loaderOverlay) {
            loaderOverlay.innerHTML = `
                <div class="text-2xl text-red-500 text-center p-4">
                    <i class="fas fa-exclamation-triangle mb-4 text-4xl"></i><br>
                    Erreur lors du démarrage.<br>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Recharger</button>
                </div>
            `;
        } else {
            console.error('❌ Cannot display startup error: loader overlay not found');
            alert('Erreur lors du démarrage de l\'application. Veuillez recharger la page.');
        }
    }
}

// --- Initialisation ---
document.addEventListener('DOMContentLoaded', () => {
    // Make checkAuthError available globally
    if (window.checkAuthError) {
        window.checkAuthError();
    }
    
    const app = new MiddleEarthApp();
    window.app = app; // Expose app globally for debugging
    app.init().catch(console.error);
});
