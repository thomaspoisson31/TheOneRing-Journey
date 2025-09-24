// --- Data ---
        const colorMap = { red: 'rgba(239, 68, 68, 0.8)', blue: 'rgba(59, 130, 246, 0.8)', green: 'rgba(34, 197, 94, 0.8)', violet: 'rgba(139, 92, 246, 0.8)', orange: 'rgba(252, 169, 3, 0.8)', black: 'rgba(17, 24, 39, 0.8)' };
        const regionColorMap = { red: 'rgba(239, 68, 68, 0.15)', blue: 'rgba(59, 130, 246, 0.15)', green: 'rgba(34, 197, 94, 0.15)', violet: 'rgba(139, 92, 246, 0.15)', orange: 'rgba(252, 169, 3, 0.15)', black: 'rgba(17, 24, 39, 0.15)' };
        const getDefaultLocations = () => ({ "locations": [] }); // Fallback to empty if fetch fails
        const getDefaultRegions = () => ({ "regions": [] });
        let locationsData;
        let regionsData = getDefaultRegions();

        // --- DOM Elements ---
        const viewport = document.getElementById('viewport');
        const mapContainer = document.getElementById('map-container');
        const mapImage = document.getElementById('map-image');
        const loremasterMapImage = document.getElementById('loremaster-map-image');
        const drawingCanvas = document.getElementById('drawing-canvas');
        const locationsLayer = document.getElementById('locations-layer');
        const regionsLayer = document.getElementById('regions-layer');
        const infoBox = document.getElementById('info-box');
        const infoBoxClose = document.getElementById('info-box-close');
        const ctx = drawingCanvas.getContext('2d');
        const distanceContainer = document.getElementById('distance-container');
        const addLocationModal = document.getElementById('add-location-modal');
        const addRegionModal = document.getElementById('add-region-modal');
        const loaderOverlay = document.getElementById('loader-overlay');
        const journeyLogModal = document.getElementById('journey-log-modal');
        const filterPanel = document.getElementById('filter-panel');
        const mapSwitchBtn = document.getElementById('map-switch');
        const distanceDisplay = document.getElementById('distance-display');
        const authModal = document.getElementById('auth-modal');
        const authBtn = document.getElementById('auth-btn');
        const closeAuthModalBtn = document.getElementById('close-auth-modal');
        const authStatusPanel = document.getElementById('auth-status-panel');
        const authContentPanel = document.getElementById('auth-content-panel');
        const loggedInPanel = document.getElementById('logged-in-panel');
        const loggedOutPanel = document.getElementById('logged-out-panel');
        const authUserName = document.getElementById('auth-user-name');
        const contextNameInput = document.getElementById('context-name-input');
        const saveContextBtn = document.getElementById('save-context-btn');
        const savedContextsDiv = document.getElementById('saved-contexts');
        const googleSigninBtn = document.getElementById('google-signin-btn');
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettingsModalBtn = document.getElementById('close-settings-modal');

        // --- Map state ---
        let MAP_WIDTH = 0, MAP_HEIGHT = 0;
        const MAP_DISTANCE_MILES = 1150;
        const PLAYER_MAP_URL = "fr_tor_2nd_eriadors_map_page-0001.webp";
        const LOREMASTER_MAP_URL = "fr_tor_2nd_eriadors_map_page_loremaster.webp";
        const LOCATIONS_URL = "Landmarks1.json";
        let isPlayerView = true;

        // --- Transformation state ---
        let scale = 1, panX = 0, panY = 0;

        // --- Interaction states ---
        let isPanning = false, startPanX = 0, startPanY = 0;
        let isDrawingMode = false, isDrawing = false;
        let isAddingLocationMode = false;
        let isAddingRegionMode = false;
        let totalPathPixels = 0, lastPoint = null, startPoint = null;
        let draggedMarker = null, dragStartX = 0, dragStartY = 0;
        let newLocationCoords = null;
        let activeLocationId = null;
        let activeFilters = { known: false, visited: false, colors: [] };

        // --- Journey tracking ---
        let journeyPath = [];
        let traversedRegions = new Set();
        let nearbyLocations = new Set();
        const PROXIMITY_DISTANCE = 50;
        let journeyDiscoveries = []; // Chronological list of discoveries (regions and locations)

        // --- Voyage Segments ---
        let currentVoyage = null;
        let voyageSegments = [];
        let currentSegmentIndex = -1;
        let isVoyageActive = false;
        let activatedSegments = new Set(); // Track which segments have been activated

        // --- Region creation states ---
        let currentRegionPoints = [];
        let tempRegionPath = null;

        // --- Authentication state ---
        let currentUser = null; // Renamed from googleUser for broader compatibility
        let savedContexts = [];

        // --- Season state ---
        let currentSeason = 'printemps-debut';
        const seasonSymbols = {
            'printemps': '🌱',
            'ete': '☀️',
            'automne': '🍂',
            'hiver': '❄️'
        };

        const seasonNames = {
            'printemps-debut': 'Printemps-début',
            'printemps-milieu': 'Printemps-milieu',
            'printemps-fin': 'Printemps-fin',
            'ete-debut': 'Été-début',
            'ete-milieu': 'Été-milieu',
            'ete-fin': 'Été-fin',
            'automne-debut': 'Automne-début',
            'automne-milieu': 'Automne-milieu',
            'automne-fin': 'Automne-fin',
            'hiver-debut': 'Hiver-début',
            'hiver-milieu': 'Hiver-milieu',
            'hiver-fin': 'Hiver-fin'
        };

        // --- Calendar state ---
        let calendarData = null;
        let currentCalendarDate = null; // { month: "Gwaeron", day: 1 }
        let isCalendarMode = false;

        // --- Auto-sync state ---
        let autoSyncEnabled = false;
        let lastSyncTime = 0;
        const SYNC_DELAY = 2000; // 2 seconds delay before auto-sync

        // --- Maps management ---
        let availableMaps = [];
        let currentMapConfig = {
            playerMap: 'fr_tor_2nd_eriadors_map_page-0001.webp',
            loremasterMap: 'fr_tor_2nd_eriadors_map_page_loremaster.webp'
        };
        let editingMapIndex = -1;

        // --- DOM Helper ---
        const dom = {
            getElementById: (id) => document.getElementById(id),
            querySelector: (selector) => document.querySelector(selector),
            showModal: (modal) => modal.classList.remove('hidden'),
            hideModal: (modal) => modal.classList.add('hidden'),
            voyageSegmentsModal: document.getElementById('voyage-segments-modal')
        };

        // --- Voyage Manager ---
        let voyageManager;

        // =============================================================================
        // POINT D'INSERTION POUR LES FICHIERS SÉPARÉS
        // =============================================================================
        // Les fonctions seront réparties comme suit :
        // main1.js : Fonctions de gestion des cartes, authentification, saisons/calendrier
        // main2.js : Fonctions de gestion des lieux, régions, filtres
        // main3.js : Fonctions de voyage/tracé, segments, Gemini API
        // =============================================================================


        // --- Authentication Debug Logs ---
        function logAuth(message, data = null) {
            console.log(`🔐 [AUTH] ${message}`, data || '');
        }

        // --- HTML Escape Function ---
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // --- Check Google Authentication Status ---
        function checkGoogleAuth() {
            logAuth("Vérification du statut d'authentification...");
            checkAuthStatus();
        }

        // --- Check for authentication errors in URL ---
        function checkAuthError() {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('auth_error') === '1') {
                logAuth("ERREUR: Échec de l'authentification Google détecté dans l'URL");
                alert("Erreur lors de l'authentification Google. Veuillez réessayer.");
                // Nettoyer l'URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } else if (urlParams.get('auth_success') === '1') {
                logAuth("SUCCÈS: Authentification Google réussie détectée dans l'URL");
                // Nettoyer l'URL
                window.history.replaceState({}, document.title, window.location.pathname);
                // Forcer une nouvelle vérification de l'authentification
                setTimeout(() => {
                    checkGoogleAuth();
                }, 1000);
            }
        }

        // --- Toggle Authentication Modal ---
        function toggleAuthModal() {
            logAuth("Basculement de la modal d'authentification");
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                if (authModal.classList.contains('hidden')) {
                    authModal.classList.remove('hidden');
                    logAuth("Modal d'authentification ouverte");
                } else {
                    authModal.classList.add('hidden');
                    logAuth("Modal d'authentification fermée");
                }
            } else {
                logAuth("Erreur: Modal d'authentification non trouvée!");
            }
        }

        }

        // Function to properly manage event listeners to avoid accumulation
        function setupInfoBoxEventListeners(type, itemId) {
            // Get references to the buttons
            const editBtn = document.getElementById('info-box-edit');
            const deleteBtn = document.getElementById('info-box-delete');
            const expandBtn = document.getElementById('info-box-expand');

            // Clone and replace buttons to remove all existing event listeners
            if (editBtn) {
                const newEditBtn = editBtn.cloneNode(true);
                editBtn.parentNode.replaceChild(newEditBtn, editBtn);
            }
            if (deleteBtn) {
                const newDeleteBtn = deleteBtn.cloneNode(true);
                deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            }
            if (expandBtn) {
                const newExpandBtn = expandBtn.cloneNode(true);
                expandBtn.parentNode.replaceChild(newExpandBtn, expandBtn);
            }

            // Add fresh event listeners
            const freshEditBtn = document.getElementById('info-box-edit');
            const freshDeleteBtn = document.getElementById('info-box-delete');
            const freshExpandBtn = document.getElementById('info-box-expand');

            if (type === 'location') {
                if (freshEditBtn) freshEditBtn.addEventListener('click', enterEditMode);
                if (freshDeleteBtn) freshDeleteBtn.addEventListener('click', () => deleteLocation(itemId));
            } else if (type === 'region') {
                if (freshEditBtn) freshEditBtn.addEventListener('click', enterRegionEditMode);
                if (freshDeleteBtn) freshDeleteBtn.addEventListener('click', () => deleteRegion(itemId));
            }

            if (freshExpandBtn) freshExpandBtn.addEventListener('click', toggleInfoBoxExpand);
        }

        // Handle escape key to close info box
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && infoBox.style.display === 'block') {
                hideInfoBox();
            }
        });
    
