// --- Import des fonctions modales ---
        // Les fonctions modales sont chargées depuis le fichier modals.js via une balise script

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
        let draggedMarker = null, dragStartX = 0, dragStartY = 0;
        let newLocationCoords = null;
        let activeLocationId = null;
        let activeFilters = { known: false, visited: false, colors: [] };

        // --- Journey tracking (moved to journey.js) ---

        // --- Voyage Segments (moved to journey.js) ---

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

        // --- Maps Management Functions ---
        function loadMapsData() {
            const savedMaps = localStorage.getItem('availableMaps');
            const savedConfig = localStorage.getItem('currentMapConfig');

            if (savedMaps) {
                try {
                    availableMaps = JSON.parse(savedMaps);
                } catch (e) {
                    console.error('Error loading maps data:', e);
                    availableMaps = [];
                }
            }

            if (savedConfig) {
                try {
                    currentMapConfig = JSON.parse(savedConfig);
                } catch (e) {
                    console.error('Error loading map config:', e);
                }
            }

            // Ajouter les cartes par défaut si la liste est vide
            if (availableMaps.length === 0) {
                availableMaps = [
                    {
                        id: 1,
                        name: 'Carte Joueur - Eriadors',
                        filename: 'fr_tor_2nd_eriadors_map_page-0001.webp',
                        type: 'player',
                        isDefault: true
                    },
                    {
                        id: 2,
                        name: 'Carte Gardien - Eriadors',
                        filename: 'fr_tor_2nd_eriadors_map_page_loremaster.webp',
                        type: 'loremaster',
                        isDefault: true
                    }
                ];
                saveMapsData();
            }
        }

        function saveMapsData() {
            localStorage.setItem('availableMaps', JSON.stringify(availableMaps));
            localStorage.setItem('currentMapConfig', JSON.stringify(currentMapConfig));
            scheduleAutoSync();
        }

        function renderMapsGrid() {
            const mapsGrid = document.getElementById('maps-grid');
            if (!mapsGrid) return;

            mapsGrid.innerHTML = availableMaps.map(map => {
                const isActive = (map.type === 'player' && currentMapConfig.playerMap === map.filename) ||
                                (map.type === 'loremaster' && currentMapConfig.loremasterMap === map.filename);

                return `
                    <div class="bg-gray-800 rounded-lg p-3 border ${isActive ? 'border-blue-500' : 'border-gray-600'} relative">
                        ${isActive ? '<div class="absolute top-2 right-2 text-blue-400"><i class="fas fa-check-circle"></i></div>' : ''}
                        <div class="aspect-video bg-gray-700 rounded-lg mb-2 overflow-hidden">
                            <img src="${map.filename}" alt="${map.name}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiHElaaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjc3NDhDIi8+Cjwvc3ZnPg=='">
                        </div>
                        <div class="text-sm font-medium text-white mb-1">${map.name}</div>
                        <div class="text-xs text-gray-400 mb-2">${map.type === 'player' ? 'Carte Joueur' : 'Carte Gardien'}</div>
                        <div class="flex space-x-2">
                            <button class="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs ${isActive ? 'opacity-50 cursor-not-allowed' : ''}"
                                    onclick="setActiveMap('${map.filename}', '${map.type}')"
                                    ${isActive ? 'disabled' : ''}>
                                ${isActive ? 'Active' : 'Activer'}
                            </button>
                            <button class="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs" onclick="editMap(${availableMaps.indexOf(map)})">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${!map.isDefault ? `<button class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs" onclick="deleteMap(${availableMaps.indexOf(map)})"><i class="fas fa-trash"></i></button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function setActiveMap(filename, type) {
            if (type === 'player') {
                currentMapConfig.playerMap = filename;
                // Mettre à jour l'image active
                mapImage.src = filename;
                document.getElementById('active-player-map-preview').src = filename;
            } else if (type === 'loremaster') {
                currentMapConfig.loremasterMap = filename;
                // Mettre à jour l'image du gardien
                loremasterMapImage.src = filename;
                document.getElementById('active-loremaster-map-preview').src = filename;
            }

            saveMapsData();
            renderMapsGrid();
        }

        function openMapModal(editIndex = -1) {
            editingMapIndex = editIndex;
            const modal = document.getElementById('map-modal');
            const title = document.getElementById('map-modal-title');
            const nameInput = document.getElementById('map-name-input');
            const fileInput = document.getElementById('map-file-input');
            const previewContainer = document.getElementById('map-preview-container');
            const previewImage = document.getElementById('map-preview-image');
            const saveText = document.getElementById('save-map-text');

            if (editIndex >= 0) {
                const map = availableMaps[editIndex];
                title.innerHTML = '<i class="fas fa-map-marked-alt mr-2"></i>Modifier la carte';
                nameInput.value = map.name;
                previewContainer.classList.remove('hidden');
                previewImage.src = map.filename;
                document.querySelector(`input[name="map-type"][value="${map.type}"]`).checked = true;
                saveText.textContent = 'Modifier';
            } else {
                title.innerHTML = '<i class="fas fa-map-marked-alt mr-2"></i>Ajouter une carte';
                nameInput.value = '';
                fileInput.value = '';
                previewContainer.classList.add('hidden');
                document.querySelector('input[name="map-type"][value="player"]').checked = true;
                saveText.textContent = 'Ajouter';
            }

            modal.classList.remove('hidden');
        }

        function closeMapModal() {
            document.getElementById('map-modal').classList.add('hidden');
            editingMapIndex = -1;
        }

        function editMap(index) {
            openMapModal(index);
        }

        function deleteMap(index) {
            if (availableMaps[index].isDefault) {
                alert('Impossible de supprimer une carte par défaut.');
                return;
            }

            if (confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) {
                availableMaps.splice(index, 1);
                saveMapsData();
                renderMapsGrid();
            }
        }

        function setupMapsEventListeners() {
            // Bouton ajouter une carte
            document.getElementById('add-map-btn')?.addEventListener('click', () => openMapModal());

            // Boutons de la modal
            document.getElementById('close-map-modal')?.addEventListener('click', closeMapModal);
            document.getElementById('cancel-map-btn')?.addEventListener('click', closeMapModal);
            document.getElementById('save-map-btn')?.addEventListener('click', saveMap);

            // Preview de l'image lors de la sélection
            document.getElementById('map-file-input')?.addEventListener('change', handleMapFileSelect);
        }

        function handleMapFileSelect(event) {
            const file = event.target.files[0];
            const previewContainer = document.getElementById('map-preview-container');
            const previewImage = document.getElementById('map-preview-image');

            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                    previewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        }

        function saveMap() {
            const nameInput = document.getElementById('map-name-input');
            const fileInput = document.getElementById('map-file-input');
            const mapType = document.querySelector('input[name="map-type"]:checked').value;

            if (!nameInput.value.trim()) {
                alert('Veuillez entrer un nom pour la carte.');
                return;
            }

            if (editingMapIndex >= 0) {
                // Modification d'une carte existante
                availableMaps[editingMapIndex].name = nameInput.value.trim();
                availableMaps[editingMapIndex].type = mapType;

                if (fileInput.files.length > 0) {
                    // Nouvelle image sélectionnée
                    const file = fileInput.files[0];
                    const filename = `map_${Date.now()}_${file.name}`;
                    availableMaps[editingMapIndex].filename = filename;

                    // Note: Dans un vrai système, ici on uploadrait le fichier
                    // Pour cette démo, on utilise un data URL
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        availableMaps[editingMapIndex].dataUrl = e.target.result;
                        saveMapsData();
                        renderMapsGrid();
                        closeMapModal();
                    };
                    reader.readAsDataURL(file);
                    return;
                }
            } else {
                // Nouvelle carte
                if (fileInput.files.length === 0) {
                    alert('Veuillez sélectionner un fichier image.');
                    return;
                }

                const file = fileInput.files[0];
                const filename = `map_${Date.now()}_${file.name}`;

                const reader = new FileReader();
                reader.onload = (e) => {
                    const newMap = {
                        id: Date.now(),
                        name: nameInput.value.trim(),
                        filename: filename,
                        type: mapType,
                        isDefault: false,
                        dataUrl: e.target.result
                    };

                    availableMaps.push(newMap);
                    saveMapsData();
                    renderMapsGrid();
                    closeMapModal();
                };
                reader.readAsDataURL(file);
                return;
            }

            saveMapsData();
            renderMapsGrid();
            closeMapModal();
        }

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

        // --- Initialization ---
        async function loadInitialLocations() {
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

            console.log("No valid saved data found. Fetching from URL:", LOCATIONS_URL);
            try {
                // Ajouter un timeout pour éviter les attentes infinies
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

                const response = await fetch(LOCATIONS_URL, {
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
                locationsData = getDefaultLocations();
                // Sauvegarder même la liste vide pour éviter les futures tentatives de chargement
                saveLocationsToLocal();
            }
        }

        function initializeMap() {
            console.log("🗺️ Initializing map...");
            if (mapImage.naturalWidth === 0) {
                console.warn("⚠️ Map image not loaded yet, retrying...");
                return;
            }

            console.log("📐 Map dimensions:", mapImage.naturalWidth, "x", mapImage.naturalHeight);
            MAP_WIDTH = mapImage.naturalWidth;
            MAP_HEIGHT = mapImage.naturalHeight;
            mapContainer.style.width = `${MAP_WIDTH}px`;
            mapContainer.style.height = `${MAP_HEIGHT}px`;
            drawingCanvas.width = MAP_WIDTH;
            drawingCanvas.height = MAP_HEIGHT;
            regionsLayer.setAttribute('width', MAP_WIDTH);
            regionsLayer.setAttribute('height', MAP_HEIGHT);
            regionsLayer.setAttribute('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
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

            // Initialize VoyageManager
            voyageManager = new VoyageManager(dom);
            voyageManager.init();

            console.log("✅ Map initialized successfully");
        }

        function preloadLoremasterMap() {
            console.log("Preloading Loremaster map...");
            const lmImage = new Image();
            lmImage.onload = () => {
                console.log("✅ Loremaster map preloaded.");
                loremasterMapImage.src = LOREMASTER_MAP_URL;
                mapSwitchBtn.classList.remove('hidden');
            };
            lmImage.onerror = () => {
                console.error("Failed to preload Loremaster map.");
            };
            lmImage.src = LOREMASTER_MAP_URL;
        }

        // --- Location Markers & Info Box ---
        function renderLocations() {
            locationsLayer.innerHTML = '';
            const filteredLocations = locationsData.locations.filter(location => {
                // Skip locations without coordinates
                if (!location.coordinates || typeof location.coordinates.x === 'undefined' || typeof location.coordinates.y === 'undefined') {
                    return false;
                }
                const knownMatch = !activeFilters.known || location.known;
                const visitedMatch = !activeFilters.visited || location.visited;
                const colorMatch = activeFilters.colors.length === 0 || activeFilters.colors.includes(location.color);
                return knownMatch && visitedMatch && colorMatch;
            });

            filteredLocations.forEach(location => {
                const marker = document.createElement('div');
                marker.className = 'location-marker';
                marker.style.left = `${location.coordinates.x}px`;
                marker.style.top = `${location.coordinates.y}px`;
                marker.style.backgroundColor = location.known ? (colorMap[location.color] || colorMap.red) : 'rgba(107, 114, 128, 0.7)';
                marker.style.borderColor = location.visited ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                marker.dataset.id = location.id;

                // Configure pointer events based on current mode
                if (isDrawingMode) {
                    marker.style.pointerEvents = 'none';
                } else {
                    marker.style.pointerEvents = 'auto';

                    // Only allow dragging when not in any special mode
                    if (!isAddingLocationMode && !isAddingRegionMode) {
                        marker.addEventListener('mousedown', startDragMarker);
                    }

                    marker.addEventListener('click', (e) => {
                        if (e.detail > 0) {
                            if (!isAddingLocationMode && !isAddingRegionMode) {
                                // Show info box normally
                                showInfoBox(e);
                            }
                        }
                    });

                    // Ajouter le tooltip au survol
                    marker.title = location.name;
                }

                locationsLayer.appendChild(marker);
            });
        }

        function showInfoBox(event) {
            const marker = event.currentTarget;
            activeLocationId = parseInt(marker.dataset.id, 10);
            const location = locationsData.locations.find(loc => loc.id === activeLocationId);
            if (!location) return;

            // Update image tab content
            const imageTab = document.getElementById('image-tab');
            const images = getLocationImages(location);

            if (images.length > 0) {
                if (infoBox.classList.contains('expanded') && images.length > 1) {
                    // Multi-tab view for expanded mode with multiple images
                    const imageTabs = images.map((img, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Image ${index + 1}</button>`
                    ).join('');

                    const imageContents = images.map((img, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="image-view">
                                <img src="${img}" alt="${location.name}" title="${img.split('/').pop()}" onerror="handleImageError(this)">
                            </div>
                        </div>`
                    ).join('');

                    imageTab.innerHTML = `
                        <div class="image-tabs-container">
                            <div class="image-tabs">${imageTabs}</div>
                            <div class="image-contents">${imageContents}</div>
                        </div>
                    `;

                    setupImageTabSwitching();
                    setupImageClickHandlers();
                } else {
                    // Single image view (compact mode or single image)
                    const defaultImage = getDefaultLocationImage(location);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                                </div>` : '';
                    imageTab.innerHTML = `
                        <div class="image-view">
                            ${titleHtml}
                            <img src="${defaultImage}" alt="${location.name}" title="${defaultImage.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                        </div>
                    `;
                    setupImageClickHandlers();
                }
            } else {
                // No image - show title instead of placeholder in compact mode
                if (!infoBox.classList.contains('expanded')) {
                    imageTab.innerHTML = `
                        <div class="image-view">
                            <div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                            </div>
                        </div>
                    `;
                } else {
                    imageTab.innerHTML = `
                        <div class="image-view">
                            <div class="image-placeholder">Aucune image disponible</div>
                        </div>
                    `;
                }
            }

            // Update text tab content
            const textTab = document.getElementById('text-tab');
            textTab.innerHTML = `
                <div class="text-view">
                    <h3>${location.name}</h3>
                    <p>${location.description || 'Aucune description.'}</p>
                </div>
            `;

            // Update rumeurs tab content
            const rumeursTab = document.getElementById('rumeurs-tab');
            // Ajouter les sections Rumeurs (support multiple) et Tradition_Ancienne si elles existent
            let rumeursContent = '';
            if (location.Rumeurs && location.Rumeurs.length > 0) {
                const rumeursValides = location.Rumeurs.filter(rumeur => rumeur && rumeur !== "A définir");

                if (rumeursValides.length > 0) {
                    rumeursContent += `
                        <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                            <div class="font-bold text-yellow-300 mb-2 flex items-center">
                                <i class="fas fa-ear-listen mr-2"></i>
                                ${rumeursValides.length > 1 ? 'Rumeurs' : 'Rumeur'}
                            </div>
                    `;

                    rumeursValides.forEach((rumeur, index) => {
                        const marginClass = index > 0 ? 'mt-3 pt-3 border-t border-yellow-600 border-opacity-50' : '';
                        rumeursContent += `
                            <div class="${marginClass} text-yellow-100 text-sm italic leading-relaxed">
                                ${rumeur}
                            </div>
                        `;
                    });

                    rumeursContent += `</div>`;
                }
            }
            // Support de l'ancienne structure avec Rumeur simple
            else if (location.Rumeur && location.Rumeur !== "A définir") {
                rumeursContent += `
                    <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                        <div class="font-bold text-yellow-300 mb-2 flex items-center">
                            <i class="fas fa-ear-listen mr-2"></i>
                            Rumeur
                        </div>
                        <div class="text-yellow-100 text-sm italic leading-relaxed">
                            ${location.Rumeur}
                        </div>
                    </div>
                `;
            }
            rumeursTab.innerHTML = `<div class="text-view">${rumeursContent || '<p class="text-gray-500 italic">Aucune rumeur connue.</p>'}</div>`;


            // Update tradition tab content
            const traditionTab = document.getElementById('tradition-tab');
            traditionTab.innerHTML = `
                <div class="text-view">
                    <h3>Tradition Ancienne</h3>
                    <p>${location.Tradition_Ancienne || 'Aucune tradition ancienne connue.'}</p>
                </div>
            `;

            // Update tables tab content
            const tablesTab = document.getElementById('tables-tab');
            const tables = getLocationTables(location);

            if (tables.length > 0) {
                if (infoBox.classList.contains('expanded') && tables.length > 1) {
                    // Multi-tab view for expanded mode with multiple tables
                    const tableTabs = tables.map((table, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Table ${index + 1}</button>`
                    ).join('');

                    const tableContents = tables.map((table, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="image-view">
                                <img src="${table}" alt="Table aléatoire ${location.name}" title="${table.split('/').pop()}" onerror="handleImageError(this)">
                            </div>
                        </div>`
                    ).join('');

                    tablesTab.innerHTML = `
                        <div class="image-tabs-container">
                            <div class="image-tabs">${tableTabs}</div>
                            <div class="image-contents">${tableContents}</div>
                        </div>
                    `;

                    setupImageTabSwitching();
                    setupImageClickHandlers();
                } else {
                    // Single table view (compact mode or single table)
                    const defaultTable = getDefaultLocationTable(location);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">Tables - ${location.name}</span>
                                </div>` : '';
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            ${titleHtml}
                            <img src="${defaultTable}" alt="Table aléatoire ${location.name}" title="${defaultTable.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                        </div>
                    `;
                    setupImageClickHandlers();
                }
            } else {
                // No tables - show placeholder
                if (!infoBox.classList.contains('expanded')) {
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">Tables - ${location.name}</span>
                            </div>
                        </div>
                    `;
                } else {
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="image-placeholder">Aucune table disponible</div>
                        </div>
                    `;
                }
            }

            // Update json-tables tab content
            const jsonTablesTab = document.getElementById('json-tables-tab');
            const jsonTables = getLocationJsonTables(location);

            if (jsonTables.length > 0) {
                if (infoBox.classList.contains('expanded') && jsonTables.length > 1) {
                    // Multi-tab view for expanded mode with multiple json tables
                    const jsonTableTabs = jsonTables.map((table, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Table texte ${index + 1}</button>`
                    ).join('');

                    const jsonTableContents = jsonTables.map((table, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="json-table-container">
                                <div class="mb-3 flex justify-end">
                                    <button class="generate-random-event-btn px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm" data-table-index="${index}">
                                        <i class="fas fa-dice mr-1"></i>Générer un événement aléatoire
                                    </button>
                                </div>
                                <div class="random-event-display hidden mb-3 p-3 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg">
                                    <div class="font-bold text-yellow-300 mb-2">Événement aléatoire généré :</div>
                                    <div class="event-content text-yellow-100"></div>
                                </div>
                                ${formatJsonTableForDisplay(table)}
                            </div>
                        </div>`
                    ).join('');

                    jsonTablesTab.innerHTML = `
                        <div class="image-tabs-container">
                            <div class="image-tabs">${jsonTableTabs}</div>
                            <div class="image-contents">${jsonTableContents}</div>
                        </div>
                    `;

                    setupImageTabSwitching();
                    setupRandomEventButtons(location);
                } else {
                    // Single json table view (compact mode or single table)
                    const defaultJsonTable = getDefaultLocationJsonTable(location);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">Tables texte - ${location.name}</span>
                                </div>` : '';
                    jsonTablesTab.innerHTML = `
                        <div class="json-table-container">
                            ${titleHtml}
                            <div class="mb-3 flex justify-end">
                                <button class="generate-random-event-btn px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm" data-table-index="0">
                                    <i class="fas fa-dice mr-1"></i>Générer un événement aléatoire
                                </button>
                            </div>
                            <div class="random-event-display hidden mb-3 p-3 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg">
                                <div class="font-bold text-yellow-300 mb-2">Événement aléatoire généré :</div>
                                <div class="event-content text-yellow-100"></div>
                            </div>
                            ${formatJsonTableForDisplay(defaultJsonTable)}
                        </div>
                    `;
                    setupRandomEventButtons(location);
                }
            } else {
                // No json tables - show placeholder
                if (!infoBox.classList.contains('expanded')) {
                    jsonTablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">Tables texte - ${location.name}</span>
                            </div>
                        </div>
                    `;
                } else {
                    jsonTablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="image-placeholder">Aucune table texte disponible</div>
                        </div>
                    `;
                }
            }

            // Update header title
            updateInfoBoxHeaderTitle(location.name);

            // Show the info box
            document.getElementById('info-box-edit-content').classList.add('hidden');
            document.getElementById('info-box-content').classList.remove('hidden');

            infoBox.style.display = 'block';
            // Ouvrir en mode étendu par défaut
            if (!infoBox.classList.contains('expanded')) {
                infoBox.classList.add('expanded');
                const expandBtn = document.getElementById('info-box-expand');
                if (expandBtn) {
                    expandBtn.className = 'fas fa-compress';
                    expandBtn.title = 'Vue compacte';
                }
                const titleElement = document.getElementById('info-box-title');
                const deleteBtn = document.getElementById('info-box-delete');
                titleElement.classList.remove('hidden');
                deleteBtn.classList.remove('hidden');
            }
            positionInfoBoxExpanded();

            // Set up tab switching
            setupTabSwitching();
            // Set up event listeners for locations
            setupInfoBoxEventListeners('location', location.id);
        }

        function hideInfoBox() {
            infoBox.style.display = 'none';
            activeLocationId = null;
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

        function setupTabSwitching() {
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.dataset.tab;
                    activateTab(targetTab);
                });
            });
        }

        function activateTab(tabName) {
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
        }

        function handleImageError(imgElement) {
            imgElement.parentElement.innerHTML = '<div class="image-placeholder">Erreur de chargement de l\'image</div>';
        }

        function getLocationImages(location) {
            // Support both old format (imageUrl) and new format (images array)
            if (location.images && Array.isArray(location.images)) {
                return location.images.map(img => img.url).filter(url => url);
            } else if (location.imageUrl) {
                return [location.imageUrl];
            }
            return [];
        }

        function getDefaultLocationImage(location) {
            if (location.images && Array.isArray(location.images)) {
                const defaultImg = location.images.find(img => img.isDefault);
                return defaultImg ? defaultImg.url : (location.images[0] ? location.images[0].url : '');
            } else if (location.imageUrl) {
                return location.imageUrl;
            }
            return '';
        }

        function setupImageTabSwitching() {
            const imageTabButtons = document.querySelectorAll('.image-tab-button');
            const imageContents = document.querySelectorAll('.image-content');

            imageTabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetIndex = button.dataset.imageIndex;

                    // Update active tab button
                    imageTabButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Update active image content
                    imageContents.forEach(content => content.classList.remove('active'));
                    document.querySelector(`[data-image-index="${targetIndex}"].image-content`).classList.add('active');
                });
            });
        }

        function setupImageClickHandlers() {
            // Add click listener to make images toggle fullscreen
            document.querySelectorAll('.modal-image').forEach(img => {
                img.addEventListener('click', (e) => {
                    // Prevent event from propagating to parent elements if needed
                    e.stopPropagation();

                    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

                    if (!isFullscreen) {
                        // Request fullscreen
                        const element = img.parentElement.parentElement; // Go up to the .image-view or .image-content container
                        if (element.requestFullscreen) {
                            element.requestFullscreen();
                        } else if (element.webkitRequestFullscreen) { /* Safari */
                            element.webkitRequestFullscreen();
                        } else if (element.mozRequestFullScreen) { /* Firefox */
                            element.mozRequestFullScreen();
                        } else if (element.msRequestFullscreen) { /* IE11 */
                            element.msRequestFullscreen();
                        }
                    } else {
                        // Exit fullscreen
                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        } else if (document.webkitExitFullscreen) { /* Safari */
                            document.webkitExitFullscreen();
                        } else if (document.mozCancelFullScreen) { /* Firefox */
                            document.mozCancelFullScreen();
                        } else if (document.msExitFullscreen) { /* IE11 */
                            document.msExitFullscreen();
                        }
                    }
                });
            });
        }


        function getRegionImages(region) {
            if (region.images && Array.isArray(region.images)) {
                return region.images.map(img => img.url).filter(url => url);
            }
            return [];
        }

        function getDefaultRegionImage(region) {
            if (region.images && Array.isArray(region.images)) {
                const defaultImg = region.images.find(img => img.isDefault);
                return defaultImg ? defaultImg.url : (region.images[0] ? region.images[0].url : '');
            }
            return '';
        }

        function getLocationTables(location) {
            if (location.tables && Array.isArray(location.tables)) {
                return location.tables.map(table => table.url).filter(url => url);
            }
            return [];
        }

        function getDefaultLocationTable(location) {
            if (location.tables && Array.isArray(location.tables)) {
                const defaultTable = location.tables.find(table => table.isDefault);
                return defaultTable ? defaultTable.url : (location.tables[0] ? location.tables[0].url : '');
            }
            return '';
        }

        function getRegionTables(region) {
            if (region.tables && Array.isArray(region.tables)) {
                return region.tables.map(table => table.url).filter(url => url);
            }
            return [];
        }

        function getDefaultRegionTable(region) {
            if (region.tables && Array.isArray(region.tables)) {
                const defaultTable = region.tables.find(table => table.isDefault);
                return defaultTable ? defaultTable.url : (region.tables[0] ? region.tables[0].url : '');
            }
            return '';
        }

        function getLocationJsonTables(location) {
            if (location.jsonTables && Array.isArray(location.jsonTables)) {
                return location.jsonTables.map(table => table.content).filter(content => content);
            }
            return [];
        }

        function getDefaultLocationJsonTable(location) {
            if (location.jsonTables && Array.isArray(location.jsonTables)) {
                const defaultTable = location.jsonTables.find(table => table.isDefault);
                return defaultTable ? defaultTable.content : (location.jsonTables[0] ? location.jsonTables[0].content : '');
            }
            return '';
        }

        function getRegionJsonTables(region) {
            if (region.jsonTables && Array.isArray(region.jsonTables)) {
                return region.jsonTables.map(table => table.content).filter(content => content);
            }
            return [];
        }

        function getDefaultRegionJsonTable(region) {
            if (region.jsonTables && Array.isArray(region.jsonTables)) {
                const defaultTable = region.jsonTables.find(table => table.isDefault);
                return defaultTable ? defaultTable.content : (region.jsonTables[0] ? region.jsonTables[0].content : '');
            }
            return '';
        }

        function validateJsonTable(content) {
            try {
                const parsed = JSON.parse(content);
                if (!Array.isArray(parsed)) {
                    return { valid: false, message: "Le JSON doit être un tableau d'objets" };
                }

                for (let i = 0; i < parsed.length; i++) {
                    const item = parsed[i];
                    if (typeof item !== 'object' || item === null) {
                        return { valid: false, message: `L'élément ${i + 1} doit être un objet` };
                    }

                    // Vérification optionnelle du format attendu
                    const hasDestinyDie = item.hasOwnProperty('Dé du destin');
                    const hasResult = item.hasOwnProperty('Résultat');
                    const hasDescription = item.hasOwnProperty('Description');

                    if (hasDestinyDie || hasResult || hasDescription) {
                        if (!hasDestinyDie || !hasResult || !hasDescription) {
                            return {
                                valid: false,
                                message: `L'élément ${i + 1} semble suivre le format standard mais il manque des propriétés (Dé du destin, Résultat, Description)`,
                                warning: true
                            };
                        }
                    }
                }

                return { valid: true, message: "Format JSON valide" };
            } catch (e) {
                return { valid: false, message: `JSON invalide: ${e.message}` };
            }
        }

        function formatJsonTableForDisplay(content) {
            try {
                const parsed = JSON.parse(content);
                if (!Array.isArray(parsed)) return content;

                let html = '<div class="json-table-display">';

                // Vérifier si c'est le format standard avec "Dé du destin"
                const isStandardFormat = parsed.length > 0 && parsed[0].hasOwnProperty('Dé du destin');

                if (isStandardFormat) {
                    html += '<table class="w-full border-collapse border border-gray-600 text-sm">';
                    html += '<thead><tr class="bg-gray-700">';
                    html += '<th class="border border-gray-600 px-2 py-1">Dé du destin</th>';
                    html += '<th class="border border-gray-600 px-2 py-1">Résultat</th>';
                    html += '<th class="border border-gray-600 px-2 py-1">Description</th>';
                    html += '</tr></thead><tbody>';

                    parsed.forEach(item => {
                        html += '<tr>';
                        html += `<td class="border border-gray-600 px-2 py-1 font-bold text-center">${escapeHtml(item['Dé du destin'] || '')}</td>`;
                        html += `<td class="border border-gray-600 px-2 py-1 font-semibold">${escapeHtml(item['Résultat'] || '')}</td>`;
                        html += `<td class="border border-gray-600 px-2 py-1">${escapeHtml(item['Description'] || '')}</td>`;
                        html += '</tr>';
                    });

                    html += '</tbody></table>';
                } else {
                    // Format libre - affichage en liste
                    html += '<div class="space-y-2">';
                    parsed.forEach((item, index) => {
                        html += `<div class="bg-gray-800 rounded p-2 border border-gray-600">`;
                        html += `<div class="font-semibold text-blue-400 mb-1">Entrée ${index + 1}</div>`;
                        Object.entries(item).forEach(([key, value]) => {
                            html += `<div><span class="font-medium">${escapeHtml(key)}:</span> ${escapeHtml(String(value))}</div>`;
                        });
                        html += '</div>';
                    });
                    html += '</div>';
                }

                html += '</div>';
                return html;
            } catch (e) {
                return `<div class="text-red-400">Erreur d'affichage: ${escapeHtml(e.message)}</div>`;
            }
        }

        function generateRandomEvent(jsonContent) {
            try {
                const parsed = JSON.parse(jsonContent);
                if (!Array.isArray(parsed) || parsed.length === 0) {
                    throw new Error("Tableau vide ou invalide");
                }

                const randomIndex = Math.floor(Math.random() * parsed.length);
                const randomEntry = parsed[randomIndex];

                // Construire la description de l'événement
                let eventDescription = '';

                if (randomEntry['Dé du destin'] && randomEntry['Résultat'] && randomEntry['Description']) {
                    // Format standard
                    eventDescription = `**${randomEntry['Résultat']}** (${randomEntry['Dé du destin']})\n\n${randomEntry['Description']}`;
                } else {
                    // Format libre
                    eventDescription = Object.entries(randomEntry)
                        .map(([key, value]) => `**${key}:** ${value}`)
                        .join('\n\n');
                }

                return eventDescription;
            } catch (e) {
                throw new Error(`Impossible de générer un événement: ${e.message}`);
            }
        }

               function enterEditMode() {
            const location = locationsData.locations.find(loc => loc.id === activeLocationId);
            if (!location) return;

            // Mark the info box as being in edit mode
            infoBox.dataset.editMode = 'true';

            // Update image tab to show image editing interface
            updateImageTabForEdit(location);

            // Update text tab to show text editing interface
            updateTextTabForEdit(location);

            // Update rumeurs tab to show rumeurs editing interface
            updateRumeursTabForEdit(location);

            // Update tradition tab to show tradition editing interface
            updateTraditionTabForEdit(location);

            // Update tables tab to show tables editing interface
            updateTablesTabForEdit(location);

            // Update json-tables tab to show json-tables editing interface
            updateJsonTablesTabForEdit(location);

            // Add edit controls at the bottom
            addEditControls();
        }

        function updateImageTabForEdit(location) {
            const imageTab = document.getElementById('image-tab');
            const images = location.images || [];
            const imagesHtml = generateImageEditHTML(images);

            const colorPickerHtml = Object.keys(colorMap).map(color =>
                `<div class="color-swatch ${location.color === color ? 'selected' : ''}" data-color="${color}" style="background-color: ${colorMap[color]}"></div>`
            ).join('');

            imageTab.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gray-700 p-3 rounded-md">
                        <label class="block text-sm font-medium text-gray-300 mb-2">Images (max 5)</label>
                        <div id="edit-images-container">${imagesHtml}</div>
                        <button id="add-image-btn" class="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm">Ajouter une image</button>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Couleur</label>
                        <div class="flex space-x-2" id="edit-color-picker">${colorPickerHtml}</div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center">
                            <input id="edit-known" type="checkbox" ${location.known ? 'checked' : ''} class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <label for="edit-known" class="ml-2 block text-sm text-gray-300">Connu</label>
                        </div>
                        <div class="flex items-center">
                            <input id="edit-visited" type="checkbox" ${location.visited ? 'checked' : ''} class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <label for="edit-visited" class="ml-2 block text-sm text-gray-300">Visité</label>
                        </div>
                    </div>
                </div>
            `;

            setupImageEditListeners();
            setupColorPickerListeners();
            setupStatusCheckboxListeners();
        }

        function updateTextTabForEdit(location) {
            const textTab = document.getElementById('text-tab');
            textTab.innerHTML = `
                <div class="text-view space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Nom</label>
                        <input type="text" id="edit-name" value="${location.name}" placeholder="Nom" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <div class="flex items-start space-x-2">
                            <textarea id="edit-desc" rows="4" placeholder="Description" class="flex-1 bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${location.description || ''}</textarea>
                            <button id="generate-edit-desc" class="p-2 bg-purple-600 hover:bg-purple-700 rounded-md" title="Générer une description"><span class="gemini-icon">✨</span></button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('generate-edit-desc').addEventListener('click', handleGenerateDescription);
        }

        function updateRumeursTabForEdit(location) {
            const rumeursTab = document.getElementById('rumeurs-tab');
            // Utiliser un champ textarea pour les rumeurs multiples, séparées par des sauts de ligne
            const rumeursString = Array.isArray(location.Rumeurs) ? location.Rumeurs.join('\n') : (location.Rumeur || '');
            rumeursTab.innerHTML = `
                <div class="text-view space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Rumeurs</label>
                        <textarea id="edit-rumeur" rows="6" placeholder="Rumeur" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${rumeursString}</textarea>
                    </div>
                </div>
            `;
        }

        function updateTraditionTabForEdit(location) {
            const traditionTab = document.getElementById('tradition-tab');
            traditionTab.innerHTML = `
                <div class="text-view space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Tradition Ancienne</label>
                        <textarea id="edit-tradition" rows="6" placeholder="Tradition Ancienne" class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white">${location.Tradition_Ancienne || ''}</textarea>
                    </div>
                </div>
            `;
        }

        function updateTablesTabForEdit(location) {
            const tablesTab = document.getElementById('tables-tab');
            const tables = location.tables || [];
            const tablesHtml = generateTablesEditHTML(tables);

            tablesTab.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gray-700 p-3 rounded-md">
                        <label class="block text-sm font-medium text-gray-300 mb-2">Tables aléatoires (max 5)</label>
                        <div id="edit-tables-container">${tablesHtml}</div>
                        <button id="add-table-btn" class="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm">Ajouter une table</button>
                    </div>
                </div>
            `;

            setupTablesEditListeners();
        }

        function updateJsonTablesTabForEdit(location) {
            const jsonTablesTab = document.getElementById('json-tables-tab');
            const jsonTables = location.jsonTables || [];
            const jsonTablesHtml = generateJsonTablesEditHTML(jsonTables);

            jsonTablesTab.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gray-700 p-3 rounded-md">
                        <label class="block text-sm font-medium text-gray-300 mb-2">Tables aléatoires - Texte (max 5)</label>
                        <div id="edit-json-tables-container">${jsonTablesHtml}</div>
                        <button id="add-json-table-btn" class="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm">Ajouter une table texte</button>
                    </div>
                </div>
            `;

            setupJsonTablesEditListeners();
        }

        function generateJsonTablesEditHTML(jsonTables) {
            if (!jsonTables || jsonTables.length === 0) {
                return '<div class="text-gray-400 text-sm">Aucune table texte</div>';
            }

            return jsonTables.map((table, index) => `
                <div class="json-table-edit-item space-y-2 p-3 border border-gray-600 rounded-md">
                    <div class="flex items-center space-x-2">
                        <label class="flex items-center text-sm">
                            <input type="checkbox" class="default-json-table-checkbox mr-1" ${table.isDefault ? 'checked' : ''}>
                            <span class="text-gray-300">Table par défaut</span>
                        </label>
                        <button class="remove-json-table-btn text-red-400 hover:text-red-300 px-2 py-1 ml-auto" data-index="${index}">
                            <i class="fas fa-trash text-xs"></i> Supprimer
                        </button>
                    </div>
                    <textarea class="json-table-content-input w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono" rows="8" placeholder="Collez votre JSON ici...">${table.content || ''}</textarea>
                    <div class="json-validation-message text-xs"></div>
                </div>
            `).join('');
        }

        function setupJsonTablesEditListeners() {
            const container = document.getElementById('edit-json-tables-container');
            const addButton = document.getElementById('add-json-table-btn');

            if (addButton) {
                addButton.addEventListener('click', addNewJsonTableRow);
            }

            if (container) {
                container.addEventListener('click', (e) => {
                    if (e.target.closest('.remove-json-table-btn')) {
                        const button = e.target.closest('.remove-json-table-btn');
                        const item = button.closest('.json-table-edit-item');
                        if (item) {
                            item.remove();
                            updateJsonTableIndices();
                        }
                    }
                });

                container.addEventListener('change', (e) => {
                    if (e.target.classList.contains('default-json-table-checkbox') && e.target.checked) {
                        // Uncheck other default checkboxes
                        container.querySelectorAll('.default-json-table-checkbox').forEach(cb => {
                            if (cb !== e.target) cb.checked = false;
                        });
                    }
                });

                container.addEventListener('input', (e) => {
                    if (e.target.classList.contains('json-table-content-input')) {
                        const validation = validateJsonTable(e.target.value);
                        const messageDiv = e.target.closest('.json-table-edit-item').querySelector('.json-validation-message');

                        if (e.target.value.trim() === '') {
                            messageDiv.textContent = '';
                            messageDiv.className = 'json-validation-message text-xs';
                        } else if (validation.valid) {
                            messageDiv.textContent = '✓ Format JSON valide';
                            messageDiv.className = 'json-validation-message text-xs text-green-400';
                        } else {
                            messageDiv.textContent = `⚠ ${validation.message}`;
                            messageDiv.className = validation.warning ?
                                'json-validation-message text-xs text-yellow-400' :
                                'json-validation-message text-xs text-red-400';
                        }
                    }
                });
            }
        }

        function addNewJsonTableRow() {
            const container = document.getElementById('edit-json-tables-container');
            const currentTables = container.querySelectorAll('.json-table-edit-item');

            if (currentTables.length >= 5) {
                alert('Maximum 5 tables texte autorisées');
                return;
            }

            const newIndex = currentTables.length;
            const newRow = document.createElement('div');
            newRow.className = 'json-table-edit-item space-y-2 p-3 border border-gray-600 rounded-md';
            newRow.innerHTML = `
                <div class="flex items-center space-x-2">
                    <label class="flex items-center text-sm">
                        <input type="checkbox" class="default-json-table-checkbox mr-1" ${newIndex === 0 ? 'checked' : ''}>
                        <span class="text-gray-300">Table par défaut</span>
                    </label>
                    <button class="remove-json-table-btn text-red-400 hover:text-red-300 px-2 py-1 ml-auto" data-index="${newIndex}">
                        <i class="fas fa-trash text-xs"></i> Supprimer
                    </button>
                </div>
                <textarea class="json-table-content-input w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm font-mono" rows="8" placeholder="Collez votre JSON ici..."></textarea>
                <div class="json-validation-message text-xs"></div>
            `;

            container.appendChild(newRow);
            updateJsonTableIndices();
        }

        function updateJsonTableIndices() {
            const container = document.getElementById('edit-json-tables-container');
            container.querySelectorAll('.remove-json-table-btn').forEach((btn, index) => {
                btn.dataset.index = index;
            });
        }

        function collectJsonTablesFromEdit() {
            const container = document.getElementById('edit-json-tables-container');
            const jsonTables = [];

            container.querySelectorAll('.json-table-edit-item').forEach(item => {
                const content = item.querySelector('.json-table-content-input').value.trim();
                const isDefault = item.querySelector('.default-json-table-checkbox').checked;

                if (content) {
                    jsonTables.push({ content, isDefault });
                }
            });

            // Ensure at least one default if tables exist
            if (jsonTables.length > 0 && !jsonTables.some(table => table.isDefault)) {
                jsonTables[0].isDefault = true;
            }

            return jsonTables;
        }

        function generateTablesEditHTML(tables) {
            if (!tables || tables.length === 0) {
                return '<div class="text-gray-400 text-sm">Aucune table</div>';
            }

            return tables.map((table, index) => `
                <div class="table-edit-item flex items-center space-x-2 p-2 rounded">
                    <input type="url" class="table-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" value="${table.url || ''}" placeholder="Chemin vers la table (ex: images/Tables/Table-Bois-de-Chet.jpg)">
                    <label class="flex items-center text-sm">
                        <input type="checkbox" class="default-table-checkbox mr-1" ${table.isDefault ? 'checked' : ''}>
                        <span class="text-gray-300">Défaut</span>
                    </label>
                    <button class="remove-table-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${index}">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            `).join('');
        }

        function setupTablesEditListeners() {
            const container = document.getElementById('edit-tables-container');
            const addButton = document.getElementById('add-table-btn');

            if (addButton) {
                addButton.addEventListener('click', addNewTableRow);
            }

            if (container) {
                container.addEventListener('click', (e) => {
                    if (e.target.closest('.remove-table-btn')) {
                        const button = e.target.closest('.remove-table-btn');
                        const item = button.closest('.table-edit-item');
                        if (item) {
                            item.remove();
                            updateTableIndices();
                        }
                    }
                });

                container.addEventListener('change', (e) => {
                    if (e.target.classList.contains('default-table-checkbox') && e.target.checked) {
                        // Uncheck other default checkboxes
                        container.querySelectorAll('.default-table-checkbox').forEach(cb => {
                            if (cb !== e.target) cb.checked = false;
                        });
                    }
                });
            }
        }

        function addNewTableRow() {
            const container = document.getElementById('edit-tables-container');
            const currentTables = container.querySelectorAll('.table-edit-item');

            if (currentTables.length >= 5) {
                alert('Maximum 5 tables autorisées');
                return;
            }

            const newIndex = currentTables.length;
            const newRow = document.createElement('div');
            newRow.className = 'table-edit-item flex items-center space-x-2 p-2 rounded';
            newRow.innerHTML = `
                <input type="url" class="table-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" placeholder="Chemin vers la table (ex: images/Tables/Table-Bois-de-Chet.jpg)">
                <label class="flex items-center text-sm">
                    <input type="checkbox" class="default-table-checkbox mr-1" ${newIndex === 0 ? 'checked' : ''}>
                    <span class="text-gray-300">Défaut</span>
                </label>
                <button class="remove-table-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${newIndex}">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            `;

            container.appendChild(newRow);
            updateTableIndices();
        }

        function updateTableIndices() {
            const container = document.getElementById('edit-tables-container');
            container.querySelectorAll('.remove-table-btn').forEach((btn, index) => {
                btn.dataset.index = index;
            });
        }

        function collectTablesFromEdit() {
            const container = document.getElementById('edit-tables-container');
            const tables = [];

            container.querySelectorAll('.table-edit-item').forEach(item => {
                const url = item.querySelector('.table-url-input').value.trim();
                const isDefault = item.querySelector('.default-table-checkbox').checked;

                if (url) {
                    tables.push({ url, isDefault });
                }
            });

            // Ensure at least one default if tables exist
            if (tables.length > 0 && !tables.some(table => table.isDefault)) {
                tables[0].isDefault = true;
            }

            return tables;
        }

        function addEditControls() {
            // Add save/cancel buttons at the bottom of the scroll wrapper
            const scrollWrapper = document.getElementById('info-box-scroll-wrapper');
            let editControls = document.getElementById('edit-controls');

            if (!editControls) {
                editControls = document.createElement('div');
                editControls.id = 'edit-controls';
                editControls.className = 'mt-4 pt-4 border-t border-gray-600 flex justify-end space-x-2 bg-gray-900 sticky bottom-0';
                scrollWrapper.appendChild(editControls);
            }

            editControls.innerHTML = `
                <button id="cancel-edit" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm">Annuler</button>
                <button id="save-edit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm">Sauver</button>
            `;

            document.getElementById('save-edit').addEventListener('click', saveEdit);
            document.getElementById('cancel-edit').addEventListener('click', cancelEdit);
        }

        function setupColorPickerListeners() {
            document.getElementById('edit-color-picker').querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.addEventListener('click', () => {
                    document.querySelector('#edit-color-picker .color-swatch.selected').classList.remove('selected');
                    swatch.classList.add('selected');
                });
            });
        }

        function generateImageEditHTML(images) {
            if (!images || images.length === 0) {
                return '<div class="text-gray-400 text-sm">Aucune image</div>';
            }

            return images.map((image, index) => `
                <div class="image-edit-item flex items-center space-x-2 p-2 rounded">
                    <input type="url" class="image-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" value="${image.url || ''}" placeholder="URL de l'image">
                    <label class="flex items-center text-sm">
                        <input type="checkbox" class="default-image-checkbox mr-1" ${image.isDefault ? 'checked' : ''}>
                        <span class="text-gray-300">Défaut</span>
                    </label>
                    <button class="remove-image-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${index}">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            `).join('');
        }

        function setupImageEditListeners() {
            const container = document.getElementById('edit-images-container');
            const addButton = document.getElementById('add-image-btn');

            if (addButton) {
                addButton.addEventListener('click', addNewImageRow);
            }

            if (container) {
                container.addEventListener('click', (e) => {
                    if (e.target.closest('.remove-image-btn')) {
                        const button = e.target.closest('.remove-image-btn');
                        const item = button.closest('.image-edit-item');
                        if (item) {
                            item.remove();
                            updateImageIndices();
                        }
                    }
                });

                container.addEventListener('change', (e) => {
                    if (e.target.classList.contains('default-image-checkbox') && e.target.checked) {
                        // Uncheck other default checkboxes
                        container.querySelectorAll('.default-image-checkbox').forEach(cb => {
                            if (cb !== e.target) cb.checked = false;
                        });
                    }
                });
            }
        }

        function addNewImageRow() {
            const container = document.getElementById('edit-images-container');
            const currentImages = container.querySelectorAll('.image-edit-item');

            if (currentImages.length >= 5) {
                alert('Maximum 5 images autorisées');
                return;
            }

            const newIndex = currentImages.length;
            const newRow = document.createElement('div');
            newRow.className = 'image-edit-item flex items-center space-x-2 p-2 rounded';
            newRow.innerHTML = `
                <input type="url" class="image-url-input flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" placeholder="URL de l'image">
                <label class="flex items-center text-sm">
                    <input type="checkbox" class="default-image-checkbox mr-1" ${newIndex === 0 ? 'checked' : ''}>
                    <span class="text-gray-300">Défaut</span>
                </label>
                <button class="remove-image-btn text-red-400 hover:text-red-300 px-2 py-1" data-index="${newIndex}">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            `;

            container.appendChild(newRow);
            updateImageIndices();
        }

        function updateImageIndices() {
            const container = document.getElementById('edit-images-container');
            container.querySelectorAll('.remove-image-btn').forEach((btn, index) => {
                btn.dataset.index = index;
            });
        }

        function setupRandomEventButtons(location) {
            const buttons = document.querySelectorAll('.generate-random-event-btn');
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const tableIndex = parseInt(e.currentTarget.dataset.tableIndex);
                    const jsonTables = getLocationJsonTables(location);

                    if (jsonTables[tableIndex]) {
                        try {
                            const eventText = generateRandomEvent(jsonTables[tableIndex]);

                            // Trouver le conteneur d'affichage d'événement approprié
                            const container = e.currentTarget.closest('.image-content, .json-table-container');
                            const eventDisplay = container.querySelector('.random-event-display');
                            const eventContent = container.querySelector('.event-content');

                            eventContent.innerHTML = eventText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
                            eventContent.innerHTML = '<p>' + eventContent.innerHTML + '</p>';
                            eventContent.innerHTML = eventContent.innerHTML.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                            eventDisplay.classList.remove('hidden');
                        } catch (error) {
                            alert(`Erreur lors de la génération de l'événement: ${error.message}`);
                        }
                    }
                });
            });
        }

        function setupStatusCheckboxListeners() {
            document.getElementById('edit-visited').addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.getElementById('edit-known').checked = true;
                }
            });
        }

        function collectImagesFromEdit() {
            const container = document.getElementById('edit-images-container');
            const images = [];

            if (!container) {
                return images; // Retourner un tableau vide si le conteneur n'existe pas
            }

            container.querySelectorAll('.image-edit-item').forEach(item => {
                const urlElement = item.querySelector('.image-url-input');
                const defaultElement = item.querySelector('.default-image-checkbox');

                if (urlElement && defaultElement) {
                    const url = urlElement.value.trim();
                    const isDefault = defaultElement.checked;

                    if (url) {
                        images.push({ url, isDefault });
                    }
                }
            });

            // Ensure at least one default if images exist
            if (images.length > 0 && !images.some(img => img.isDefault)) {
                images[0].isDefault = true;
            }

            return images;
        }

        function saveEdit() {
            const location = locationsData.locations.find(loc => loc.id === activeLocationId);
            if (!location) return;

            const nameElement = document.getElementById('edit-name');
            const descElement = document.getElementById('edit-desc');
            const rumeurElement = document.getElementById('edit-rumeur');
            const traditionElement = document.getElementById('edit-tradition');
            const colorElement = document.querySelector('#edit-color-picker .color-swatch.selected');
            const knownElement = document.getElementById('edit-known');
            const visitedElement = document.getElementById('edit-visited');

            if (nameElement) location.name = nameElement.value;
            if (descElement) location.description = descElement.value;
            if (rumeurElement) {
                location.Rumeurs = rumeurElement.value.split('\n').filter(r => r.trim() !== ''); // Split by newline for multiple rumors
            }
            if (traditionElement) location.Tradition_Ancienne = traditionElement.value;
            if (colorElement) location.color = colorElement.dataset.color;
            if (knownElement) location.known = knownElement.checked;
            if (visitedElement) location.visited = visitedElement.checked;


            // Handle images
            const images = collectImagesFromEdit();
            if (images.length > 0) {
                location.images = images;
                // Remove old imageUrl if exists
                delete location.imageUrl;
            } else {
                // No images, remove both old and new format
                delete location.images;
                delete location.imageUrl;
            }

            // Handle tables
            const tables = collectTablesFromEdit();
            if (tables.length > 0) {
                location.tables = tables;
            } else {
                delete location.tables;
            }

            // Handle json tables
            const jsonTables = collectJsonTablesFromEdit();
            if (jsonTables.length > 0) {
                location.jsonTables = jsonTables;
            } else {
                delete location.jsonTables;
            }

            saveLocationsToLocal();
            renderLocations();
            hideInfoBox();
        }

        function cancelEdit() {
            // Remove edit mode flag
            delete infoBox.dataset.editMode;
            // Remove edit controls
            const editControls = document.getElementById('edit-controls');
            if (editControls) {
                editControls.remove();
            }

            // Re-show the location info without edit mode - reload fresh content
            const location = locationsData.locations.find(loc => loc.id === activeLocationId);
            if (location) {
                showLocationContent(location);
            }
        }

        function showLocationContent(location) {
            // Update image tab content
            const imageTab = document.getElementById('image-tab');
            const images = getLocationImages(location);

            if (images.length > 0) {
                if (infoBox.classList.contains('expanded') && images.length > 1) {
                    // Multi-tab view for expanded mode with multiple images
                    const imageTabs = images.map((img, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Image ${index + 1}</button>`
                    ).join('');

                    const imageContents = images.map((img, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="image-view">
                                <img src="${img}" alt="${location.name}" title="${img.split('/').pop()}" onerror="handleImageError(this)">
                            </div>
                        </div>`
                    ).join('');

                    imageTab.innerHTML = `
                        <div class="image-tabs-container">
                            <div class="image-tabs">${imageTabs}</div>
                            <div class="image-contents">${imageContents}</div>
                        </div>
                    `;

                    setupImageTabSwitching();
                    setupImageClickHandlers();
                } else {
                    // Single image view (compact mode or single image)
                    const defaultImage = getDefaultLocationImage(location);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                                </div>` : '';
                    imageTab.innerHTML = `
                        <div class="image-view">
                            ${titleHtml}
                            <img src="${defaultImage}" alt="${location.name}" title="${defaultImage.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                        </div>
                    `;
                    setupImageClickHandlers();
                }
            } else {
                // No image - show title instead of placeholder in compact mode
                if (!infoBox.classList.contains('expanded')) {
                    imageTab.innerHTML = `
                        <div class="image-view">
                            <div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">${location.name}</span>
                            </div>
                        </div>
                    `;
                } else {
                    imageTab.innerHTML = `
                        <div class="image-view">
                            <div class="image-placeholder">Aucune image disponible</div>
                        </div>
                    `;
                }
            }

            // Update text tab content
            const textTab = document.getElementById('text-tab');
            textTab.innerHTML = `
                <div class="text-view">
                    <h3>${location.name}</h3>
                    <p>${location.description || 'Aucune description.'}</p>
                </div>
            `;

            // Update rumeurs tab content
            const rumeursTab = document.getElementById('rumeurs-tab');
            // Ajouter les sections Rumeurs (support multiple) et Tradition_Ancienne si elles existent
            let rumeursContent = '';
            if (location.Rumeurs && location.Rumeurs.length > 0) {
                const rumeursValides = location.Rumeurs.filter(rumeur => rumeur && rumeur !== "A définir");

                if (rumeursValides.length > 0) {
                    rumeursContent += `
                        <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                            <div class="font-bold text-yellow-300 mb-2 flex items-center">
                                <i class="fas fa-ear-listen mr-2"></i>
                                ${rumeursValides.length > 1 ? 'Rumeurs' : 'Rumeur'}
                            </div>
                    `;

                    rumeursValides.forEach((rumeur, index) => {
                        const marginClass = index > 0 ? 'mt-3 pt-3 border-t border-yellow-600 border-opacity-50' : '';
                        rumeursContent += `
                            <div class="${marginClass} text-yellow-100 text-sm italic leading-relaxed">
                                ${rumeur}
                            </div>
                        `;
                    });

                    rumeursContent += `</div>`;
                }
            }
            // Support de l'ancienne structure avec Rumeur simple
            else if (location.Rumeur && location.Rumeur !== "A définir") {
                rumeursContent += `
                    <div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                        <div class="font-bold text-yellow-300 mb-2 flex items-center">
                            <i class="fas fa-ear-listen mr-2"></i>
                            Rumeur
                        </div>
                        <div class="text-yellow-100 text-sm italic leading-relaxed">
                            ${location.Rumeur}
                        </div>
                    </div>
                `;
            }
            rumeursTab.innerHTML = `<div class="text-view">${rumeursContent || '<p class="text-gray-500 italic">Aucune rumeur connue.</p>'}</div>`;


            // Update tradition tab content
            const traditionTab = document.getElementById('tradition-tab');
            traditionTab.innerHTML = `
                <div class="text-view">
                    <h3>Tradition Ancienne</h3>
                    <p>${location.Tradition_Ancienne || 'Aucune tradition ancienne connue.'}</p>
                </div>
            `;

            // Update tables tab content - FIX: Utiliser la même logique que dans showInfoBox
            const tablesTab = document.getElementById('tables-tab');
            const tables = getLocationTables(location);

            if (tables.length > 0) {
                if (infoBox.classList.contains('expanded') && tables.length > 1) {
                    // Multi-tab view for expanded mode with multiple tables
                    const tableTabs = tables.map((table, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Table ${index + 1}</button>`
                    ).join('');

                    const tableContents = tables.map((table, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="image-view">
                                <img src="${table}" alt="Table aléatoire ${location.name}" title="${table.split('/').pop()}" onerror="handleImageError(this)">
                            </div>
                        </div>`
                    ).join('');

                    tablesTab.innerHTML = `
                        <div class="image-tabs-container">
                            <div class="image-tabs">${tableTabs}</div>
                            <div class="image-contents">${tableContents}</div>
                        </div>
                    `;

                    setupImageTabSwitching();
                    setupImageClickHandlers();
                } else {
                    // Single table view (compact mode or single table)
                    const defaultTable = getDefaultLocationTable(location);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">Tables - ${location.name}</span>
                                </div>` : '';
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            ${titleHtml}
                            <img src="${defaultTable}" alt="Table aléatoire ${location.name}" title="${defaultTable.split('/').pop()}" onerror="handleImageError(this)" class="modal-image">
                        </div>
                    `;
                    setupImageClickHandlers();
                }
            } else {
                // No tables - show placeholder
                if (!infoBox.classList.contains('expanded')) {
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">Tables - ${location.name}</span>
                            </div>
                        </div>
                    `;
                } else {
                    tablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="image-placeholder">Aucune table disponible</div>
                        </div>
                    `;
                }
            }

            // Update json-tables tab content - same logic as in showInfoBox
            const jsonTablesTab = document.getElementById('json-tables-tab');
            const jsonTables = getLocationJsonTables(location);

            if (jsonTables.length > 0) {
                if (infoBox.classList.contains('expanded') && jsonTables.length > 1) {
                    // Multi-tab view for expanded mode with multiple json tables
                    const jsonTableTabs = jsonTables.map((table, index) =>
                        `<button class="image-tab-button ${index === 0 ? 'active' : ''}" data-image-index="${index}">Table texte ${index + 1}</button>`
                    ).join('');

                    const jsonTableContents = jsonTables.map((table, index) =>
                        `<div class="image-content ${index === 0 ? 'active' : ''}" data-image-index="${index}">
                            <div class="json-table-container">
                                <div class="mb-3 flex justify-end">
                                    <button class="generate-random-event-btn px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm" data-table-index="${index}">
                                        <i class="fas fa-dice mr-1"></i>Générer un événement aléatoire
                                    </button>
                                </div>
                                <div class="random-event-display hidden mb-3 p-3 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg">
                                    <div class="font-bold text-yellow-300 mb-2">Événement aléatoire généré :</div>
                                    <div class="event-content text-yellow-100"></div>
                                </div>
                                ${formatJsonTableForDisplay(table)}
                            </div>
                        </div>`
                    ).join('');

                    jsonTablesTab.innerHTML = `
                        <div class="image-tabs-container">
                            <div class="image-tabs">${jsonTableTabs}</div>
                            <div class="image-contents">${jsonTableContents}</div>
                        </div>
                    `;

                    setupImageTabSwitching();
                    setupRandomEventButtons(location);
                } else {
                    // Single json table view (compact mode or single table)
                    const defaultJsonTable = getDefaultLocationJsonTable(location);
                    const titleHtml = !infoBox.classList.contains('expanded') ? `<div class="compact-title">
                                    <span style="font-family: 'Merriweather', serif;">Tables texte - ${location.name}</span>
                                </div>` : '';
                    jsonTablesTab.innerHTML = `
                        <div class="json-table-container">
                            ${titleHtml}
                            <div class="mb-3 flex justify-end">
                                <button class="generate-random-event-btn px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm" data-table-index="0">
                                    <i class="fas fa-dice mr-1"></i>Générer un événement aléatoire
                                </button>
                            </div>
                            <div class="random-event-display hidden mb-3 p-3 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg">
                                <div class="font-bold text-yellow-300 mb-2">Événement aléatoire généré :</div>
                                <div class="event-content text-yellow-100"></div>
                            </div>
                            ${formatJsonTableForDisplay(defaultJsonTable)}
                        </div>
                    `;
                    setupRandomEventButtons(location);
                }
            } else {
                // No json tables - show placeholder
                if (!infoBox.classList.contains('expanded')) {
                    jsonTablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="compact-title">
                                <span style="font-family: 'Merriweather', serif;">Tables texte - ${location.name}</span>
                            </div>
                        </div>
                    `;
                } else {
                    jsonTablesTab.innerHTML = `
                        <div class="image-view">
                            <div class="image-placeholder">Aucune table texte disponible</div>
                        </div>
                    `;
                }
            }
        }

        function deleteLocation(locationId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?')) {
                const locationIndex = locationsData.locations.findIndex(loc => loc.id === locationId);
                if (locationIndex !== -1) {
                    locationsData.locations.splice(locationIndex, 1);
                    saveLocationsToLocal();
                    renderLocations();
                    hideInfoBox();
                }
            }
        }

        function deleteRegion(regionId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) {
                const regionIndex = regionsData.regions.findIndex(reg => reg.id === regionId);
                if (regionIndex !== -1) {
                    regionsData.regions.splice(regionIndex, 1);
                    saveRegionsToLocal();
                    renderRegions();
                    hideInfoBox();
                }
            }
        }

        async function handleGenerateRegionDescription(event) {
            const button = event.currentTarget;
            const regionName = document.getElementById('edit-region-name').value;
            const descTextarea = document.getElementById('edit-region-desc');

            if (!regionName) {
                alert("Veuillez d'abord entrer un nom pour la région.");
                return;
            }

            const prompt = `Rédige une courte description évocatrice pour une région de la Terre du Milieu nommée '${regionName}'. Décris son apparence, son climat, sa géographie et son histoire possible, dans le style de J.R.R. Tolkien. Sois concis et évocateur.`;

            const result = await callGemini(prompt, button);
            descTextarea.value = result;
        }

        function addRegionPoint(coords) {
            console.log("🌍 Adding region point:", coords);
            currentRegionPoints.push(coords);
            console.log("🌍 Current region points count:", currentRegionPoints.length);

            // Create or update temporary visual feedback
            updateTempRegion();

            // Add visual point indicator
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', coords.x);
            circle.setAttribute('cy', coords.y);
            circle.setAttribute('r', 4);
            circle.classList.add('region-point');
            circle.dataset.tempPoint = 'true';
            regionsLayer.appendChild(circle);
            console.log("🌍 Visual point added to SVG");

            if (currentRegionPoints.length >= 3) {
                console.log("🌍 Region has enough points for completion (double-click to finish)");
            }
        }

        function updateTempRegion() {
            // Remove existing temp path
            const existingTemp = regionsLayer.querySelector('.region-temp');
            if (existingTemp) existingTemp.remove();

            if (currentRegionPoints.length >= 2) {
                const pathData = `M ${currentRegionPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.classList.add('region-temp');
                regionsLayer.appendChild(path);
                tempRegionPath = path;
            }
        }

        function completeRegion() {
            if (currentRegionPoints.length >= 3) {
                // Show modal to get region details
                showAddRegionModal();
            } else {
                alert('Une région doit avoir au moins 3 points.');
            }
        }

        function showAddRegionModal() {
            addRegionModal.classList.remove('hidden');
            document.getElementById('region-name-input').focus();

            // Setup color picker
            const regionColorPicker = document.getElementById('region-color-picker');
            regionColorPicker.innerHTML = Object.keys(regionColorMap).map((color, index) =>
                `<div class="color-swatch ${index === 0 ? 'selected' : ''}" data-color="${color}" style="background-color: ${regionColorMap[color]}; border: 2px solid ${colorMap[color]};"></div>`
            ).join('');

            regionColorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.addEventListener('click', () => {
                    regionColorPicker.querySelector('.color-swatch.selected').classList.remove('selected');
                    swatch.classList.add('selected');
                });
            });
        }

        function cancelRegionCreation() {
            currentRegionPoints = [];
            // Remove temporary visuals
            regionsLayer.querySelectorAll('[data-temp-point]').forEach(el => el.remove());
            if (tempRegionPath) {
                tempRegionPath.remove();
                tempRegionPath = null;
            }

            isAddingRegionMode = false;
            viewport.classList.remove('adding-region');
            document.getElementById('add-region-mode').classList.remove('btn-active');
        }

        function saveRegion() {
            const nameInput = document.getElementById('region-name-input');
            const descInput = document.getElementById('region-desc-input');
            const selectedColor = document.querySelector('#region-color-picker .selected').dataset.color;

            if (nameInput.value && currentRegionPoints.length >= 3) {
                const newRegion = {
                    id: Date.now(),
                    name: nameInput.value,
                    description: descInput.value,
                    color: selectedColor,
                    points: [...currentRegionPoints],
                    Rumeurs: [], // Initialize Rumeurs as an empty array
                    Tradition_Ancienne: "A définir"
                };

                regionsData.regions.push(newRegion);
                saveRegionsToLocal();
                renderRegions();

                // Clean up
                currentRegionPoints = [];
                regionsLayer.querySelectorAll('[data-temp-point]').forEach(el => el.remove());
                if (tempRegionPath) {
                    tempRegionPath.remove();
                    tempRegionPath = null;
                }

                addRegionModal.classList.add('hidden');
                nameInput.value = '';
                descInput.value = '';

                isAddingRegionMode = false;
                viewport.classList.remove('adding-region');
                document.getElementById('add-region-mode').classList.remove('btn-active');
            }
        }

        function saveRegionsToLocal() {
            localStorage.setItem('middleEarthRegions', JSON.stringify(regionsData));
            scheduleAutoSync(); // Synchroniser après modification
        }

        function loadRegionsFromLocal() {
            const saved = localStorage.getItem('middleEarthRegions');
            if (saved) {
                try {
                    regionsData = JSON.parse(saved);
                    // Ensure Rumeurs is an array for all regions
                    regionsData.regions.forEach(region => {
                        if (!Array.isArray(region.Rumeurs)) {
                            if (region.Rumeur && region.Rumeur !== "A définir") {
                                region.Rumeurs = [region.Rumeur];
                            } else {
                                region.Rumeurs = [];
                            }
                            delete region.Rumeur; // Remove the old Rumeur property
                        }
                    });
                } catch (e) {
                    console.error('Failed to load regions from localStorage:', e);
                    regionsData = getDefaultRegions();
                }
            }
        }

        function handleImageError() {
            console.error("❌ Erreur de chargement de l'image de carte");
            loaderOverlay.innerHTML = `<div class="text-2xl text-red-500 text-center p-4"><i class="fas fa-exclamation-triangle mb-4 text-4xl"></i><br>Erreur de chargement de la carte.<br><span class="text-sm text-gray-400 mt-2">Vérifiez que les fichiers de carte sont disponibles.</span></div>`;
        }
        function startDragMarker(e) { e.stopPropagation(); draggedMarker = e.target; dragStartX = e.clientX; dragStartY = e.clientY; document.addEventListener('mousemove', dragMarker); document.addEventListener('mouseup', stopDragMarker); }
        function dragMarker(e) { if (!draggedMarker) return; const deltaX = e.clientX - dragStartX; const deltaY = e.clientY - dragStartY; const newX = parseFloat(draggedMarker.style.left) + (deltaX / scale); const newY = parseFloat(draggedMarker.style.top) + (deltaY / scale); draggedMarker.style.left = `${newX}px`; draggedMarker.style.top = `${newY}px`; dragStartX = e.clientX; dragStartY = e.clientY; }
        function stopDragMarker() { if (!draggedMarker) return; const locationId = parseInt(draggedMarker.dataset.id, 10); const location = locationsData.locations.find(loc => loc.id === locationId); if (location) { location.coordinates.x = parseFloat(draggedMarker.style.left); location.coordinates.y = parseFloat(draggedMarker.style.top); } draggedMarker = null; document.removeEventListener('mousemove', dragMarker); document.removeEventListener('mouseup', stopDragMarker); saveLocationsToLocal(); }
        function applyTransform() { mapContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`; }
        function resetView() { const viewportWidth = viewport.clientWidth; if (viewportWidth === 0 || MAP_WIDTH === 0) return; scale = viewportWidth / MAP_WIDTH; panX = 0; panY = 0; applyTransform(); }
        function setupFilters() {
            const filterColorPicker = document.getElementById('filter-color-picker');
            filterColorPicker.innerHTML = Object.keys(colorMap).map(color => `
                <label title="${color.charAt(0).toUpperCase() + color.slice(1)}" class="relative cursor-pointer">
                    <input type="checkbox" data-color="${color}" class="filter-color-checkbox sr-only peer">
                    <div class="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-white" style="background-color: ${colorMap[color]}"></div>
                </label>
            `).join('');

            document.getElementById('filter-toggle').addEventListener('click', (e) => {
                e.stopPropagation();
                filterPanel.classList.toggle('hidden');
            });

            // Fermer le panneau de filtre en cliquant en dehors
            document.addEventListener('click', (e) => {
                if (!filterPanel.contains(e.target) && !document.getElementById('filter-toggle').contains(e.target)) {
                    filterPanel.classList.add('hidden');
                }
            });

            // Empêcher la fermeture en cliquant à l'intérieur du panneau
            filterPanel.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            document.getElementById('filter-known').addEventListener('change', updateFilters);
            document.getElementById('filter-visited').addEventListener('change', updateFilters);
            document.querySelectorAll('.filter-color-checkbox').forEach(cb => cb.addEventListener('change', updateFilters));
            document.getElementById('reset-filters').addEventListener('click', resetFilters);
            document.getElementById('filter-show-regions').addEventListener('change', updateFilters); // Add listener for region visibility filter

            // Charger les filtres sauvegardés
            loadFiltersFromLocal();
        }
        function updateFilters() {
            activeFilters.known = document.getElementById('filter-known').checked;
            activeFilters.visited = document.getElementById('filter-visited').checked;
            activeFilters.colors = [];
            document.querySelectorAll('.filter-color-checkbox:checked').forEach(cb => {
                activeFilters.colors.push(cb.dataset.color);
            });
            renderLocations();

            // Show or hide regions based on the checkbox
            const showRegions = document.getElementById('filter-show-regions').checked;
            if (showRegions) {
                renderRegions();
                regionsLayer.style.display = 'block';
            } else {
                regionsLayer.style.display = 'none';
            }

            // Sauvegarder les filtres dans le localStorage
            saveFiltersToLocal();
            scheduleAutoSync();
        }
        function resetFilters() {
            document.getElementById('filter-known').checked = false;
            document.getElementById('filter-visited').checked = false;
            document.querySelectorAll('.filter-color-checkbox').forEach(cb => cb.checked = false);
            document.getElementById('filter-show-regions').checked = true; // Reset region visibility to checked
            updateFilters();
        }

        function saveFiltersToLocal() {
            const filterState = {
                known: activeFilters.known,
                visited: activeFilters.visited,
                colors: activeFilters.colors,
                showRegions: document.getElementById('filter-show-regions').checked
            };
            localStorage.setItem('middleEarthFilters', JSON.stringify(filterState));
        }

        function loadFiltersFromLocal() {
            const saved = localStorage.getItem('middleEarthFilters');
            if (saved) {
                try {
                    const filterState = JSON.parse(saved);
                    activeFilters.known = filterState.known || false;
                    activeFilters.visited = filterState.visited || false;
                    activeFilters.colors = filterState.colors || [];

                    // Appliquer les filtres à l'interface
                    document.getElementById('filter-known').checked = activeFilters.known;
                    document.getElementById('filter-visited').checked = activeFilters.visited;
                    document.getElementById('filter-show-regions').checked = filterState.showRegions !== undefined ? filterState.showRegions : true;

                    // Appliquer les couleurs
                    document.querySelectorAll('.filter-color-checkbox').forEach(cb => {
                        cb.checked = activeFilters.colors.includes(cb.dataset.color);
                    });

                    // Appliquer les filtres
                    renderLocations();
                    const showRegions = document.getElementById('filter-show-regions').checked;
                    if (showRegions) {
                        renderRegions();
                        regionsLayer.style.display = 'block';
                    } else {
                        regionsLayer.style.display = 'none';
                    }
                } catch (e) {
                    console.error('Failed to load filters from localStorage:', e);
                }
            }
        }
        viewport.addEventListener('wheel', (event) => { event.preventDefault(); const zoomIntensity = 0.1; const wheel = event.deltaY < 0 ? 1 : -1; const zoom = Math.exp(wheel * zoomIntensity); const rect = viewport.getBoundingClientRect(); const mouseX = event.clientX - rect.left; const mouseY = event.clientY - rect.top; panX = mouseX - (mouseX - panX) * zoom; panY = mouseY - (mouseY - panY) * zoom; scale = Math.max(0.1, Math.min(scale * zoom, 5)); applyTransform(); });
        // Gestionnaire mousedown principal du viewport
        function handleViewportMouseDown(event) {
            console.log("🖱️ Main viewport mousedown, mode:", {drawing: isDrawingMode, adding: isAddingLocationMode, region: isAddingRegionMode});

            if (event.target.closest('.location-marker, #info-box')) return;
            hideInfoBox();

            if (isAddingLocationMode) {
                console.log("📍 Adding location mode active");
                addLocation(event);
                return;
            }

            if (isAddingRegionMode) {
                console.log("🌍 Adding region mode active");
                const coords = getCanvasCoordinates(event);
                console.log("🌍 Adding region point at:", coords);
                addRegionPoint(coords);
                return;
            }

            if (isDrawingMode) {
                console.log("🎨 Drawing mode active, mousedown handled by drawing handler");
                return;
            }

            console.log("👆 Starting pan mode");
            event.preventDefault();
            isPanning = true;
            startPanX = event.clientX - panX;
            startPanY = event.clientY - panY;
            viewport.classList.add('panning');
        }
        viewport.addEventListener('mousemove', (event) => { if (isPanning) { event.preventDefault(); panX = event.clientX - startPanX; panY = event.clientY - startPanY; applyTransform(); } });
        ['mouseup', 'mouseleave'].forEach(event => viewport.addEventListener(event, () => { isPanning = false; viewport.classList.remove('panning'); }));
        // Gestionnaires d'événements pour le dessin - attachés au viewport au lieu du canvas
        viewport.addEventListener('mousedown', (event) => {
            console.log("🖱️ Viewport mousedown event fired, isDrawingMode:", isDrawingMode);

            // Handle drawing mode specifically
            if (isDrawingMode) {
                // Vérifier qu'on ne clique pas sur un marqueur ou autre élément
                if (event.target.closest('.location-marker, #info-box')) {
                    console.log("❌ Clicked on marker or info box, ignoring");
                    return;
                }

                console.log("🎨 Starting drawing...");
                event.preventDefault();
                event.stopPropagation();

                ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                isDrawing = true;
                totalPathPixels = 0;

                // Reset journey tracking
                journeyPath = [];
                traversedRegions.clear();
                nearbyLocations.clear();
                journeyDiscoveries = [];

                // Réinitialiser les segments de voyage
                resetVoyageSegments();

                startPoint = getCanvasCoordinates(event);
                lastPoint = startPoint;

                // Add start point to journey path
                journeyPath.push({x: startPoint.x, y: startPoint.y});

                console.log("📍 Start point:", startPoint);
                ctx.beginPath();
                ctx.moveTo(lastPoint.x, lastPoint.y);
                updateDistanceDisplay();
                distanceContainer.classList.remove('hidden');
                console.log("✅ Drawing initialized");
                return;
            }

            // Handle all other modes (panning, adding location, adding region)
            handleViewportMouseDown(event);
        });

        viewport.addEventListener('mousemove', (event) => {
            if (!isDrawing || !isDrawingMode) return;

            console.log("✏️ Mouse move during drawing");
            const currentPoint = getCanvasCoordinates(event);
            const segmentLength = Math.sqrt(Math.pow(currentPoint.x - lastPoint.x, 2) + Math.pow(currentPoint.y - lastPoint.y, 2));
            totalPathPixels += segmentLength;

            // Add current point to journey path for region/location detection
            journeyPath.push({x: currentPoint.x, y: currentPoint.y});

            lastPoint = currentPoint;
            ctx.lineTo(currentPoint.x, currentPoint.y);
            ctx.stroke();
            updateDistanceDisplay();
            console.log("✏️ Drawing segment, total pixels:", totalPathPixels.toFixed(1));
        });

        ['mouseup', 'mouseleave'].forEach(eventType => viewport.addEventListener(eventType, (event) => {
            if (isDrawing) {
                console.log("🛑 Drawing stopped on", eventType);
                isDrawing = false;
                console.log("🔄 Programmation de la synchronisation après tracé");
                scheduleAutoSync(); // Synchroniser après avoir terminé un segment de tracé
            }
        }));
        // Les boutons zoom ont été supprimés de l'interface
        // document.getElementById('zoom-in').addEventListener('click', () => { scale *= 1.2; applyTransform(); });
        // document.getElementById('zoom-out').addEventListener('click', () => { scale /= 1.2; applyTransform(); });
        // document.getElementById('reset-zoom').addEventListener('click', resetView);
        document.getElementById('draw-mode').addEventListener('click', (e) => {
            console.log("🎨 Draw mode button clicked");
            isAddingLocationMode = false;
            isAddingRegionMode = false;
            viewport.classList.remove('adding-location', 'adding-region');
            document.getElementById('add-location-mode').classList.remove('btn-active');
            document.getElementById('add-region-mode').classList.remove('btn-active');
            cancelRegionCreation();

            // Si on désactive le mode dessin et qu'il y a un tracé, synchroniser
            if (isDrawingMode && journeyPath.length > 0) {
                console.log("🔄 Synchronisation lors de la désactivation du mode dessin");
                scheduleAutoSync();
            }

            isDrawingMode = !isDrawingMode;
            console.log("🎨 Drawing mode is now:", isDrawingMode);
            viewport.classList.toggle('drawing', isDrawingMode);
            e.currentTarget.classList.toggle('btn-active', isDrawingMode);

            // Ensure canvas has proper pointer events when in drawing mode
            if (isDrawingMode) {
                drawingCanvas.style.pointerEvents = 'auto';
                console.log("✅ Canvas pointer events enabled");
            } else {
                drawingCanvas.style.pointerEvents = 'none';
                console.log("❌ Canvas pointer events disabled");
            }

            // Re-render locations to update pointer events
            renderLocations();
        });
        document.getElementById('add-location-mode').addEventListener('click', (e) => {
            isDrawingMode = false;
            isAddingRegionMode = false;
            viewport.classList.remove('drawing', 'adding-region');
            document.getElementById('draw-mode').classList.remove('btn-active');
            document.getElementById('add-region-mode').classList.remove('btn-active');
            cancelRegionCreation();
            isAddingLocationMode = !isAddingLocationMode;
            viewport.classList.toggle('adding-location', isAddingLocationMode);
            e.currentTarget.classList.toggle('btn-active', isAddingLocationMode);
            // Re-render locations to update event handlers
            renderLocations();
        });

        document.getElementById('add-region-mode').addEventListener('click', (e) => {
            isDrawingMode = false;
            isAddingLocationMode = false;
            viewport.classList.remove('drawing', 'adding-location');
            document.getElementById('draw-mode').classList.remove('btn-active');
            document.getElementById('add-location-mode').classList.remove('btn-active');
            isAddingRegionMode = !isAddingRegionMode;
            viewport.classList.toggle('adding-region', isAddingRegionMode);
            e.currentTarget.classList.toggle('btn-active', isAddingRegionMode);

            if (!isAddingRegionMode) {
                cancelRegionCreation();
            }

            renderLocations();
        });
        document.getElementById('erase').addEventListener('click', () => {
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            totalPathPixels = 0;
            startPoint = null;
            lastPoint = null;
            journeyPath = [];
            traversedRegions.clear();
            nearbyLocations.clear();
            journeyDiscoveries = []; // Clear discoveries as well

            // Réinitialiser les informations de voyage
            resetVoyageSegments();

            // Masquer le bouton de voyage
            const voyageBtn = document.getElementById('voyage-segments-btn');
            if (voyageBtn) voyageBtn.classList.add('hidden');

            updateDistanceDisplay();
            console.log("🔄 Synchronisation après effacement du tracé");
            scheduleAutoSync(); // Synchroniser après effacement du tracé
        });
        document.getElementById('export-locations').addEventListener('click', exportUnifiedData);
        document.getElementById('import-locations').addEventListener('click', () => document.getElementById('import-file-input').click());
        document.getElementById('import-file-input').addEventListener('change', importUnifiedData);

        // Event listeners pour l'import des régions
        const importRegionsBtn = document.getElementById('import-regions');
        const importRegionsInput = document.getElementById('import-regions-input');
        const exportRegionsBtn = document.getElementById('export-regions');

        if (importRegionsBtn && importRegionsInput) {
            importRegionsBtn.addEventListener('click', () => importRegionsInput.click());
            importRegionsInput.addEventListener('change', importUnifiedData);
        }

        if (exportRegionsBtn) {
            exportRegionsBtn.addEventListener('click', exportUnifiedData);
        }
        // document.getElementById('reset-locations').addEventListener('click', () => { if (confirm("Voulez-vous vraiment réinitialiser tous les lieux par défaut ?")) { locationsData = getDefaultLocations(); renderLocations(); saveLocationsToLocal(); } });
        mapSwitchBtn.addEventListener('click', () => {
            isPlayerView = !isPlayerView;
            const icon = document.getElementById('map-switch-icon');
            if (isPlayerView) {
                mapImage.style.opacity = '1';
                loremasterMapImage.style.opacity = '0';
                icon.className = 'fas fa-book-open';
                mapSwitchBtn.title = "Vue Gardien";
            } else {
                mapImage.style.opacity = '0';
                loremasterMapImage.style.opacity = '1';
                icon.className = 'fas fa-users';
                mapSwitchBtn.title = "Vue Joueurs";
            }
        });
        document.getElementById('confirm-add-location').addEventListener('click', () => { const nameInput = document.getElementById('location-name-input'); const descInput = document.getElementById('location-desc-input'); const imageInput = document.getElementById('location-image-input'); const color = document.querySelector('#add-color-picker .selected').dataset.color; const known = document.getElementById('location-known-input').checked; const visited = document.getElementById('location-visited-input').checked; if (nameInput.value && newLocationCoords) { const newLocation = { id: Date.now(), name: nameInput.value, description: descInput.value, imageUrl: imageInput.value, color: color, known: known, visited: visited, type: "custom", coordinates: newLocationCoords, Rumeurs: [], Tradition_Ancienne: "A définir" }; locationsData.locations.push(newLocation); renderLocations(); saveLocationsToLocal(); } addLocationModal.classList.add('hidden'); nameInput.value = ''; descInput.value = ''; imageInput.value = ''; newLocationCoords = null; });
        document.getElementById('cancel-add-location').addEventListener('click', () => { addLocationModal.classList.add('hidden'); document.getElementById('location-name-input').value = ''; document.getElementById('location-desc-input').value = ''; document.getElementById('location-image-input').value = ''; newLocationCoords = null; });
        function addLocation(event) { newLocationCoords = getCanvasCoordinates(event); addLocationModal.classList.remove('hidden'); document.getElementById('location-name-input').focus(); isAddingLocationMode = false; viewport.classList.remove('adding-location'); document.getElementById('add-location-mode').classList.remove('btn-active'); const addColorPicker = document.getElementById('add-color-picker'); addColorPicker.innerHTML = Object.keys(colorMap).map((color, index) => `<div class="color-swatch ${index === 0 ? 'selected' : ''}" data-color="${color}" style="background-color: ${colorMap[color]}"></div>`).join(''); addColorPicker.querySelectorAll('.color-swatch').forEach(swatch => { swatch.addEventListener('click', () => { addColorPicker.querySelector('.color-swatch.selected').classList.remove('selected'); swatch.classList.add('selected'); }); }); document.getElementById('generate-add-desc').addEventListener('click', handleGenerateDescription); document.getElementById('location-known-input').checked = true; document.getElementById('location-visited-input').checked = false; const addVisitedCheckbox = document.getElementById('location-visited-input'); const addKnownCheckbox = document.getElementById('location-known-input'); if(addVisitedCheckbox && addKnownCheckbox) { addVisitedCheckbox.addEventListener('change', () => { if (addVisitedCheckbox.checked) { addKnownCheckbox.checked = true; } }); } }
        function saveLocationsToLocal() {
            localStorage.setItem('middleEarthLocations', JSON.stringify(locationsData));
            scheduleAutoSync(); // Synchroniser après modification
        }
        // === FONCTIONS UNIFIÉES D'IMPORT/EXPORT ===

        function exportUnifiedData() {
            const allLocations = [];

            // Ajouter les lieux normaux
            if (locationsData.locations) {
                locationsData.locations.forEach(location => {
                    const exportLocation = {
                        id: location.id,
                        name: location.name,
                        description: location.description || "",
                        imageUrl: location.imageUrl || "",
                        images: location.images || [],
                        color: location.color,
                        known: location.known !== undefined ? location.known : true,
                        visited: location.visited !== undefined ? location.visited : false,
                        type: location.type || "custom",
                        coordinates: location.coordinates || { x: 0, y: 0 }
                    };

                    // Ajouter les rumeurs multiples si elles existent
                    if (location.Rumeurs && location.Rumeurs.length > 0) {
                        location.Rumeurs.forEach(rumeur => {
                            exportLocation.Rumeur = rumeur;
                        });
                    }
                    // Support de l'ancienne structure avec Rumeur simple
                    else if (location.Rumeur) {
                        exportLocation.Rumeur = location.Rumeur;
                    }

                    if (location.Tradition_Ancienne) {
                        exportLocation.Tradition_Ancienne = location.Tradition_Ancienne;
                    }

                    allLocations.push(exportLocation);
                });
            }

            // Ajouter les régions converties en format unifié
            if (regionsData.regions) {
                regionsData.regions.forEach(region => {
                    const exportRegion = {
                        id: region.id,
                        name: region.name,
                        description: region.description || "",
                        imageUrl: region.imageUrl || "",
                        images: region.images || [],
                        color: region.color,
                        known: region.known !== undefined ? region.known : true,
                        visited: region.visited !== undefined ? region.visited : false,
                        type: "region",
                        coordinates: {
                            points: region.points || []
                        }
                    };

                    // Ajouter les rumeurs multiples si elles existent
                    if (region.Rumeurs && region.Rumeurs.length > 0) {
                        region.Rumeurs.forEach(rumeur => {
                            exportRegion.Rumeur = rumeur;
                        });
                    }
                    // Support de l'ancienne structure avec Rumeur simple
                    else if (region.Rumeur) {
                        exportRegion.Rumeur = region.Rumeur;
                    }

                    if (region.Tradition_Ancienne) {
                        exportRegion.Tradition_Ancienne = region.Tradition_Ancienne;
                    }

                    allLocations.push(exportRegion);
                });
            }

            const unifiedData = {
                locations: allLocations
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(unifiedData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "Landmark.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            document.body.removeChild(downloadAnchorNode);
            console.log(`✅ Export unifié terminé - ${allLocations.length} éléments sauvegardés (lieux et régions)`);
        }

        // Ancienne fonction de compatibilité (garde pour les anciens liens)
        function exportLocationsToFile() {
            exportUnifiedData(); // Rediriger vers la fonction unifiée
        }
        function importUnifiedData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);

                    // Supporter les différents formats de fichiers
                    let locationsArray = [];

                    // Format unifié : { locations: [...] }
                    if (importedData.locations && Array.isArray(importedData.locations)) {
                        locationsArray = importedData.locations;
                    }
                    // Format ancien : { regions: [...] } - convertir les régions en locations
                    else if (importedData.regions && Array.isArray(importedData.regions)) {
                        locationsArray = importedData.regions.map(region => ({
                            id: region.id,
                            name: region.name,
                            description: region.description || "",
                            imageUrl: region.imageUrl || "",
                            color: region.color,
                            known: region.known !== undefined ? region.known : true,
                            visited: region.visited !== undefined ? region.visited : false,
                            type: "region",
                            coordinates: {
                                points: region.points || []
                            },
                            ...(region.Rumeur && { Rumeur: region.Rumeur }), // Ancienne structure Rumeur simple
                            ...(region.Tradition_Ancienne && { Tradition_Ancienne: region.Tradition_Ancienne })
                        }));
                    }
                    // Format très ancien : tableau direct de locations à la racine
                    else if (Array.isArray(importedData)) {
                        locationsArray = importedData;
                    }
                    else {
                        alert("Fichier JSON invalide. Le fichier doit contenir une propriété 'locations' (tableau) ou 'regions' (tableau), ou être un tableau direct de locations.");
                        return;
                    }

                    // Séparer les lieux normaux des régions basé sur la structure des coordonnées
                    const normalLocations = [];
                    const regionLocations = [];

                    locationsArray.forEach(item => {
                        // Déterminer si c'est une région ou un lieu normal
                        const isRegion = item.type === "region" ||
                                        (item.coordinates && item.coordinates.points && Array.isArray(item.coordinates.points));

                        if (isRegion) {
                            // Convertir la location-région vers le format région interne
                            const region = {
                                id: item.id,
                                name: item.name,
                                description: item.description || "",
                                imageUrl: item.imageUrl || "",
                                images: item.images || [], // Conserver les images pour les régions aussi
                                color: item.color,
                                known: item.known !== undefined ? item.known : true,
                                visited: item.visited !== undefined ? item.visited : false,
                                type: item.type || "region",
                                points: item.coordinates?.points || []
                            };

                            // Fonction pour extraire les rumeurs multiples
                            const extractRumeurs = (item) => {
                                const rumeurs = [];
                                // Parcourir toutes les propriétés pour trouver les rumeurs
                                for (const key in item) {
                                    if (key.startsWith('Rumeur') && item[key] !== "A définir") { // Check for Rumeur, Rumeur1, Rumeur2 etc.
                                        rumeurs.push(item[key]);
                                    }
                                }
                                return rumeurs;
                            };

                            region.Rumeurs = extractRumeurs(item);
                            if (item.Tradition_Ancienne) region.Tradition_Ancienne = item.Tradition_Ancienne;

                            regionLocations.push(region);
                        } else {
                            // C'est un lieu normal - s'assurer qu'il a la bonne structure de coordonnées
                            const location = {
                                ...item,
                                type: item.type || "custom"
                            };

                            // S'assurer que les coordonnées sont au bon format {x, y}
                            if (item.coordinates && typeof item.coordinates.x === 'number' && typeof item.coordinates.y === 'number') {
                                location.coordinates = {
                                    x: item.coordinates.x,
                                    y: item.coordinates.y
                                };
                            } else {
                                location.coordinates = { x: 0, y: 0 }; // Coordonnées par défaut si manquantes
                            }

                            // Fonction pour extraire les rumeurs multiples
                            const extractRumeurs = (item) => {
                                const rumeurs = [];
                                // Parcourir toutes les propriétés pour trouver les rumeurs
                                for (const key in item) {
                                    if (key.startsWith('Rumeur') && item[key] !== "A définir") { // Check for Rumeur, Rumeur1, Rumeur2 etc.
                                        rumeurs.push(item[key]);
                                    }
                                }
                                return rumeurs;
                            };

                            location.Rumeurs = extractRumeurs(item);
                            if (item.Tradition_Ancienne) location.Tradition_Ancienne = item.Tradition_Ancienne;

                            normalLocations.push(location);
                        }
                    });

                    // Compter les éléments à importer
                    const locationCount = normalLocations.length;
                    const regionCount = regionLocations.length;

                    let message = `Le fichier contient ${locationsArray.length} éléments :\n`;
                    if (locationCount > 0) message += `- ${locationCount} lieux\n`;
                    if (regionCount > 0) message += `- ${regionCount} régions\n`;
                    message += "\nVoulez-vous :\n- OK : Remplacer toutes les données existantes\n- Annuler : Fusionner avec les données existantes";

                    const shouldReplace = confirm(message);

                    let addedLocations = 0, updatedLocations = 0;
                    let addedRegions = 0, updatedRegions = 0;

                    // === TRAITEMENT DES LIEUX ===
                    if (locationCount > 0) {
                        if (shouldReplace) {
                            locationsData = { locations: normalLocations };
                            addedLocations = normalLocations.length;
                        } else {
                            // Fusionner les lieux
                            normalLocations.forEach(importedLocation => {
                                const existingLocation = locationsData.locations.find(
                                    loc => loc.name === importedLocation.name
                                );

                                if (existingLocation) {
                                    Object.assign(existingLocation, importedLocation);
                                    updatedLocations++;
                                } else {
                                    // Générer un nouvel ID unique pour éviter les collisions
                                    importedLocation.id = Date.now() + Math.floor(Math.random() * 1000);
                                    // S'assurer que l'ID est vraiment unique
                                    while (locationsData.locations.find(loc => loc.id === importedLocation.id)) {
                                        importedLocation.id = Date.now() + Math.floor(Math.random() * 1000);
                                    }
                                    locationsData.locations.push(importedLocation);
                                    addedLocations++;
                                }
                            });
                        }
                        renderLocations();
                        saveLocationsToLocal();
                    }

                    // === TRAITEMENT DES RÉGIONS ===
                    if (regionCount > 0) {
                        if (shouldReplace) {
                            regionsData = { regions: regionLocations };
                            addedRegions = regionLocations.length;
                        } else {
                            // Fusionner les régions
                            regionLocations.forEach(importedRegion => {
                                const existingRegion = regionsData.regions.find(
                                    reg => reg.name === importedRegion.name
                                );

                                if (existingRegion) {
                                    Object.assign(existingRegion, importedRegion);
                                    updatedRegions++;
                                } else {
                                    // Générer un nouvel ID unique pour éviter les collisions
                                    importedRegion.id = Date.now() + Math.floor(Math.random() * 1000);
                                    // S'assurer que l'ID est vraiment unique
                                    while (regionsData.regions.find(reg => reg.id === importedRegion.id)) {
                                        importedRegion.id = Date.now() + Math.floor(Math.random() * 1000);
                                    }
                                    regionsData.regions.push(importedRegion);
                                    addedRegions++;
                                }
                            });
                        }
                        renderRegions();
                        saveRegionsToLocal();
                    }

                    scheduleAutoSync();

                    // Message de confirmation
                    if (shouldReplace) {
                        let confirmMessage = "Import réussi !\n";
                        if (addedLocations > 0) confirmMessage += `- ${addedLocations} lieux importés\n`;
                        if (addedRegions > 0) confirmMessage += `- ${addedRegions} régions importées\n`;
                        alert(confirmMessage);
                    } else {
                        let confirmMessage = "Import terminé :\n";
                        if (addedLocations > 0 || updatedLocations > 0) {
                            confirmMessage += `Lieux : ${addedLocations} ajoutés, ${updatedLocations} mis à jour\n`;
                        }
                        if (addedRegions > 0 || updatedRegions > 0) {
                            confirmMessage += `Régions : ${addedRegions} ajoutées, ${updatedRegions} mises à jour\n`;
                        }
                        alert(confirmMessage);
                    }

                    console.log(`✅ Import unifié terminé - ${addedLocations + addedRegions} éléments traités`);

                } catch (err) {
                    alert("Erreur lors de la lecture du fichier JSON : " + err.message);
                    console.error("Erreur d'import unifié:", err);
                }

                // Réinitialiser l'input file
                event.target.value = '';
            };

            reader.readAsText(file);
        }

        // Anciennes fonctions de compatibilité (gardées pour les anciens liens)
        function importLocationsFromFile(event) {
            importUnifiedData(event); // Rediriger vers la fonction unifiée
        }

        function exportRegionsToFile() {
            exportUnifiedData(); // Rediriger vers la fonction unifiée
        }

        function importRegionsFromFile(event) {
            importUnifiedData(event); // Rediriger vers la fonction unifiée
        }










        // Le bouton generate-journey-log a été supprimé - la fonctionnalité est maintenant intégrée dans voyage-manager.js
        // document.getElementById('generate-journey-log').addEventListener('click', handleGenerateJourneyLog);
        document.getElementById('close-journey-log').addEventListener('click', () => journeyLogModal.classList.add('hidden'));

        // The journey button will be updated when the voyage manager is initialized

        // --- Gemini API Functions ---
        async function callGemini(prompt, button) {
            const buttonIcon = button.querySelector('.gemini-icon') || button;
            const originalContent = buttonIcon.innerHTML;
            buttonIcon.innerHTML = `<i class="fas fa-spinner gemini-btn-spinner"></i>`;
            button.disabled = true;

            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };

            try {
                // Récupérer la clé API depuis le serveur
                const configResponse = await fetch('/api/gemini/config');
                const config = await configResponse.json();

                if (!config.api_key_configured || !config.api_key) {
                    console.error("Gemini API key not configured on server.");
                    buttonIcon.innerHTML = originalContent;
                    button.disabled = false;
                    return "Erreur: Clé API Gemini non configurée sur le serveur.";
                }

                const apiModel = 'gemini-2.0-flash-exp';
                const apiVersion = 'v1beta';
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${config.api_key}`;

                // Logs pour debug
                console.log("🤖 [GEMINI API] Version:", apiVersion);
                console.log("🤖 [GEMINI API] Modèle:", apiModel);
                console.log("🤖 [GEMINI API] Prompt envoyé:");
                console.log("📝", prompt);
                console.log("🤖 [GEMINI API] URL complète:", apiUrl.replace(config.api_key, '[API_KEY_HIDDEN]'));

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                console.log("🤖 [GEMINI API] Statut de réponse:", response.status);

                if (!response.ok) {
                    // Try to get more details from the response body if available
                    let errorMsg = `API request failed with status ${response.status}`;
                    try {
                        const errorData = await response.json();
                        console.error("🤖 [GEMINI API] Erreur détaillée:", errorData);
                        errorMsg += `: ${errorData.error?.message || JSON.stringify(errorData)}`;
                    } catch (jsonError) {
                        // Ignore JSON parsing errors
                    }
                    throw new Error(errorMsg);
                }

                const result = await response.json();
                console.log("🤖 [GEMINI API] Réponse reçue:", result);

                if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                    const responseText = result.candidates[0].content.parts[0].text;
                    console.log("✅ [GEMINI API] Texte généré (longueur: " + responseText.length + " caractères)");
                    return responseText;
                } else {
                    // Handle cases where the response might be empty or malformed
                    console.warn("🤖 [GEMINI API] Réponse vide ou malformée:", result);
                    throw new Error("Invalid response structure from API");
                }
            } catch (error) {
                console.error("❌ [GEMINI API] Échec de l'appel:", error);
                return `Désolé, une erreur est survenue lors de la génération du texte: ${error.message}`;
            } finally {
                buttonIcon.innerHTML = originalContent;
                button.disabled = false;
            }
        }

        function findNearestLocation(point) {
            if (!point) return { name: 'un lieu sauvage' };
            let nearest = null;
            let minDistance = Infinity;
            locationsData.locations.forEach(loc => {
                // Ensure location has valid coordinates before calculating distance
                if (loc.coordinates && typeof loc.coordinates.x !== 'undefined' && typeof loc.coordinates.y !== 'undefined') {
                    const distance = Math.sqrt(Math.pow(loc.coordinates.x - point.x, 2) + Math.pow(loc.coordinates.y - point.y, 2));
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearest = loc;
                    }
                }
            });
            return nearest || { name: 'un lieu inconnu' };
        }

        async function handleGenerateJourneyLog(event) {
            const button = event.currentTarget;
            if (!startPoint || !lastPoint) {
                alert("Vous devez commencer un tracé sur la carte pour générer une chronique de voyage.");
                return;
            }

            const startLocation = findNearestLocation(startPoint);
            const endLocation = findNearestLocation(lastPoint);
            const miles = Math.round(totalPathPixels * (MAP_DISTANCE_MILES / MAP_WIDTH));
            const days = (Math.ceil((miles / 20) * 2) / 2).toFixed(1);

            // Générer la liste des découvertes chronologiques pour le prompt
            let journeyDetails = '';
            if (journeyDiscoveries && journeyDiscoveries.length > 0) {
                // Trier par ordre de découverte
                const chronologicalDiscoveries = journeyDiscoveries.sort((a, b) => a.discoveryIndex - b.discoveryIndex);

                const discoveryList = chronologicalDiscoveries.map((discovery, index) => {
                    const icon = discovery.type === 'region' ? '🗺️' : '📍';

                    // Calculate reach time for this discovery
                    let startIndex = 0;
                    if (index > 0) {
                        const prevDiscovery = chronologicalDiscoveries[index - 1];
                        if (prevDiscovery.type === 'region' && window.regionSegments) {
                            const segment = window.regionSegments.get(prevDiscovery.name);
                            startIndex = segment ? segment.exitIndex : prevDiscovery.discoveryIndex;
                        } else {
                            startIndex = prevDiscovery.discoveryIndex;
                        }
                    }

                    const reachDistance = calculatePathDistance(startIndex, discovery.discoveryIndex);
                    const reachMiles = pixelsToMiles(reachDistance);
                    const reachDays = milesToDays(reachMiles);

                    // Check if this is a starting location (close to journey start)
                    let travelInfo;
                    if (discovery.type === 'location' && startPoint && discovery.discoveryIndex === 0) {
                        // Find the actual location to check distance from start point
                        const location = locationsData.locations.find(loc => loc.name === discovery.name);
                        if (location && location.coordinates) {
                            const distanceFromStart = Math.sqrt(
                                Math.pow(location.coordinates.x - startPoint.x, 2) +
                                Math.pow(location.coordinates.y - startPoint.y, 2)
                            );
                            if (distanceFromStart <= 20) {
                                travelInfo = "(point de départ)";
                            } else {
                                // Add proximity information for locations
                                let proximityText = '';
                                if (discovery.proximityType === 'traversed') {
                                    proximityText = ', traversé';
                                } else if (discovery.proximityType === 'nearby') {
                                    proximityText = ', passage à proximité';
                                }
                                travelInfo = `(atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}${proximityText})`;
                            }
                        } else {
                            // Add proximity information for locations
                            let proximityText = '';
                            if (discovery.proximityType === 'traversed') {
                                proximityText = ', traversé';
                            } else if (discovery.proximityType === 'nearby') {
                                proximityText = ', passage à proximité';
                            }
                            travelInfo = `(atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}${proximityText})`;
                        }
                    } else {
                        // Add proximity information for locations
                        let proximityText = '';
                        if (discovery.type === 'location') {
                            if (discovery.proximityType === 'traversed') {
                                proximityText = ', traversé';
                            } else if (discovery.proximityType === 'nearby') {
                                proximityText = ', passage à proximité';
                            }
                        }
                        travelInfo = `(atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}${proximityText})`;
                    }

                    let displayText = `${icon} ${discovery.name} ${travelInfo}`;

                    // For regions, also calculate duration inside the region
                    if (discovery.type === 'region' && window.regionSegments) {
                        const segment = window.regionSegments.get(discovery.name);
                        if (segment) {
                            const regionDistance = calculatePathDistance(segment.entryIndex, segment.exitIndex);
                            const regionMiles = pixelsToMiles(regionDistance);
                            const regionDays = milesToDays(regionMiles);

                            // Replace travelInfo for regions to include duration
                            if (travelInfo === "(point de départ)") {
                                displayText = `${icon} ${discovery.name} (point de départ, durée ${regionDays} jour${regionDays !== 1 ? 's' : ''})`;
                            } else {
                                displayText = `${icon} ${discovery.name} (atteint en ${reachDays} jour${reachDays !== 1 ? 's' : ''}, durée ${regionDays} jour${regionDays !== 1 ? 's' : ''})`;
                            }
                        }
                    }

                    return displayText;
                }).join(', ');

                journeyDetails = `\n\nVoici les étapes de ce voyage :\n${discoveryList}`;
            }

            const narrationAddition = getNarrationPromptAddition();
            const prompt = `Rédige une courte chronique de voyage, dans le style de J.R.R. Tolkien, pour un périple en Terre du Milieu. Le voyage a débuté à ${startLocation.name} et s'est terminé près de ${endLocation.name}, couvrant une distance d'environ ${miles} miles, soit environ ${days} jours de marche. ${journeyDetails}.${narrationAddition}`;


            const journeyLogContent = document.getElementById('journey-log-content');
            journeyLogContent.innerHTML = '<p>Génération de la chronique en cours...</p>';
            journeyLogModal.classList.remove('hidden');

            const result = await callGemini(prompt, button);
            journeyLogContent.innerHTML = result.replace(/\n/g, '<br>');
        }

        async function handleGenerateDescription(event) {
            const button = event.currentTarget;
            const modal = button.closest('.bg-gray-900');
            const nameInput = modal.querySelector('input[type="text"]');
            const descTextarea = modal.querySelector('textarea');
            const locationName = nameInput.value;

            if (!locationName) {
                alert("Veuillez d'abord entrer un nom pour le lieu.");
                return;
            }

            const prompt = `Rédige une courte description évocatrice pour un lieu de la Terre du Milieu nommé '${locationName}'. Décris son apparence, son atmosphère et son histoire possible, dans le style de J.R.R. Tolkien. Sois concis.`;

            const result = await callGemini(prompt, button);
            descTextarea.value = result;
        }

        // --- Google Authentication Functions ---
        async function checkAuthStatus() {
            logAuth("🔐 [AUTH] Vérification du statut d'authentification...", "");
            try {
                const response = await fetch('/api/auth/user');
                logAuth("🔐 [AUTH] Réponse reçue:", response.status);

                if (response.ok) {
                    const data = await response.json();
                    logAuth("🔐 [AUTH] Données d'authentification reçues:", data);

                    if (data.authenticated && data.user) {
                        currentUser = data.user;
                        logAuth("🔐 [AUTH] Utilisateur authentifié:", currentUser.name);
                        updateAuthUI(true);
                        await loadSavedContexts();
                        enableAutoSync();
                    } else {
                        currentUser = null;
                        logAuth("🔐 [AUTH] Utilisateur non authentifié", "");
                        updateAuthUI(false);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                logAuth("🔐 [AUTH] Erreur lors de la vérification d'authentification:", error.message || error);
                currentUser = null;
                updateAuthUI(false);
            }
        }

        function handleGoogleSignIn() {
            logAuth("Redirection vers Google OAuth...");
            // Redirect to Google OAuth flow on the server
            window.location.href = '/auth/google';
        }

        function updateAuthUI(isAuthenticated) {
            logAuth("Mise à jour de l'interface utilisateur d'authentification");
            authStatusPanel.classList.add('hidden');
            authContentPanel.classList.remove('hidden');

            const authIcon = document.getElementById('auth-icon');
            const userProfilePic = document.getElementById('user-profile-pic');
            const authBtn = document.getElementById('auth-btn');

            if (isAuthenticated) {
                logAuth("Affichage du panneau utilisateur connecté");
                loggedInPanel.classList.remove('hidden');
                loggedOutPanel.classList.add('hidden');
                authUserName.textContent = currentUser.name || currentUser.email || 'Utilisateur';

                // Afficher la photo de profil si disponible
                if (currentUser.picture) {
                    userProfilePic.src = currentUser.picture;
                    userProfilePic.classList.remove('hidden');
                    authIcon.classList.add('hidden');
                    authBtn.title = `Connecté en tant que ${currentUser.name || currentUser.email}`;
                } else {
                    // Pas de photo, garder l'icône mais changer le style
                    userProfilePic.classList.add('hidden');
                    authIcon.classList.remove('hidden');
                    authIcon.className = 'fas fa-user-check text-green-400';
                    authBtn.title = `Connecté en tant que ${currentUser.name || currentUser.email}`;
                }

                // loadSavedContexts() est appelé dans checkAuthStatus après la confirmation de connexion
                // enableAutoSync() est appelé dans checkAuthStatus après la confirmation de connexion
            } else {
                logAuth("Affichage du panneau utilisateur non connecté");
                loggedInPanel.classList.add('hidden');
                loggedOutPanel.classList.remove('hidden');

                // Remettre l'icône par défaut
                userProfilePic.classList.add('hidden');
                authIcon.classList.remove('hidden');
                authIcon.className = 'fas fa-user';
                authBtn.title = 'Authentification et sauvegarde';

                disableAutoSync(); // Désactiver la synchronisation
            }
        }

        async function saveCurrentContext() {
            const contextName = contextNameInput.value.trim();
            if (!contextName) {
                alert("Veuillez entrer un nom pour le contexte.");
                return;
            }
            if (!currentUser) {
                alert("Vous devez être connecté pour sauvegarder des contextes.");
                return;
            }

            const currentData = {
                locations: locationsData,
                regions: regionsData,
                scale: scale,
                panX: panX,
                panY: panY,
                activeFilters: activeFilters,
                filters: activeFilters, // Ajout explicite des filtres pour compatibilité
                journeyPath: journeyPath,
                totalPathPixels: totalPathPixels,
                startPoint: startPoint,
                lastPoint: lastPoint,
                journeyDiscoveries: journeyDiscoveries, // Included journey discoveries
                currentSeason: currentSeason // Included season data
            };

            try {
                const response = await fetch('/api/contexts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: contextName, data: currentData })
                });

                if (response.ok) {
                    alert(`Contexte "${contextName}" sauvegardé avec succès !`);
                    contextNameInput.value = ''; // Clear input
                    loadSavedContexts(); // Refresh list
                } else {
                    const errorData = await response.json();
                    alert(`Erreur lors de la sauvegarde du contexte: ${errorData.error}`);
                }
            } catch (error) {
                console.error("Error saving context:", error);
                alert("Erreur réseau lors de la sauvegarde du contexte.");
            }
        }

        async function loadSavedContexts() {
            if (!currentUser) return;

            savedContextsDiv.innerHTML = '<p class="text-gray-500 italic">Chargement des contextes...</p>';
            if (!currentUser) {
                savedContextsDiv.innerHTML = '<p class="text-gray-500 italic">Connectez-vous pour voir vos contextes.</p>';
                return;
            }

            try {
                const response = await fetch('/api/contexts');
                if (response.ok) {
                    const contexts = await response.json();
                    savedContexts = contexts; // Store fetched contexts
                    displaySavedContexts(contexts);
                } else {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des contextes:', error.message || error);
                savedContextsDiv.innerHTML = '<p class="text-red-500">Impossible de charger les contextes.</p>';
            }
        }

        function setupSettingsEventListeners() {
            // Settings modal event listeners
            const settingsBtn = document.getElementById('settings-btn');
            const settingsModal = document.getElementById('settings-modal');
            const closeSettingsModalBtn = document.getElementById('close-settings-modal');

            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    settingsModal.classList.remove('hidden');
                });
                console.log("🔐 [AUTH] Bouton paramètres trouvé et configuré");
            }

            if (closeSettingsModalBtn) {
                closeSettingsModalBtn.addEventListener('click', () => {
                    settingsModal.classList.add('hidden');
                });
            }

            // Settings tabs
            const settingsTabs = document.querySelectorAll('.settings-tab-button');
            const settingsTabContents = document.querySelectorAll('.settings-tab-content');

            settingsTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetTab = tab.dataset.tab;
                    activateTab(targetTab);
                });
            });

            // Setup edit mode listeners
            setupEditModeListeners();
        }

        function setupEditModeListeners() {
            // Adventurers edit listeners
            const editAdventurersBtn = document.getElementById('edit-adventurers-btn');
            const cancelAdventurersEdit = document.getElementById('cancel-adventurers-edit');
            const saveAdventurersEdit = document.getElementById('save-adventurers-edit');
            const adventurersReadMode = document.getElementById('adventurers-read-mode');
            const adventurersEditMode = document.getElementById('adventurers-edit-mode');
            const adventurersTextarea = document.getElementById('adventurers-group');

            if (editAdventurersBtn) {
                editAdventurersBtn.addEventListener('click', () => {
                    adventurersReadMode.classList.add('hidden');
                    adventurersEditMode.classList.remove('hidden');
                });
            }

            if (cancelAdventurersEdit) {
                cancelAdventurersEdit.addEventListener('click', () => {
                    adventurersEditMode.classList.add('hidden');
                    adventurersReadMode.classList.remove('hidden');
                    // Reload original content
                    const saved = localStorage.getItem('adventurersGroup');
                    if (saved) {
                        try {
                            const adventurersData = JSON.parse(saved);
                            adventurersTextarea.value = adventurersData;
                        } catch (e) {
                            console.error('Failed to load adventurers data:', e);
                        }
                    }
                });
            }

            if (saveAdventurersEdit) {
                saveAdventurersEdit.addEventListener('click', () => {
                    const adventurersData = adventurersTextarea.value;
                    localStorage.setItem('adventurersGroup', JSON.stringify(adventurersData));
                    updateAdventurersDisplay();
                    adventurersEditMode.classList.add('hidden');
                    adventurersReadMode.classList.remove('hidden');
                    scheduleAutoSync();
                });
            }

            // Quest edit listeners
            const editQuestBtn = document.getElementById('edit-quest-btn');
            const cancelQuestEdit = document.getElementById('cancel-quest-edit');
            const saveQuestEdit = document.getElementById('save-quest-edit');
            const questReadMode = document.getElementById('quest-read-mode');
            const questEditMode = document.getElementById('quest-edit-mode');
            const questTextarea = document.getElementById('adventurers-quest');

            if (editQuestBtn) {
                editQuestBtn.addEventListener('click', () => {
                    questReadMode.classList.add('hidden');
                    questEditMode.classList.remove('hidden');
                });
            }

            if (cancelQuestEdit) {
                cancelQuestEdit.addEventListener('click', () => {
                    questEditMode.classList.add('hidden');
                    questReadMode.classList.remove('hidden');
                    // Reload original content
                    const saved = localStorage.getItem('adventurersQuest');
                    if (saved) {
                        try {
                            const questData = JSON.parse(saved);
                            questTextarea.value = questData;
                        } catch (e) {
                            console.error('Failed to load quest data:', e);
                        }
                    }
                });
            }

            if (saveQuestEdit) {
                saveQuestEdit.addEventListener('click', () => {
                    const questData = questTextarea.value;
                    localStorage.setItem('adventurersQuest', JSON.stringify(questData));
                    updateQuestDisplay();
                    questEditMode.classList.add('hidden');
                    questReadMode.classList.remove('hidden');
                    scheduleAutoSync();
                });
            }

            // Season radio button listeners
            const seasonRadios = document.querySelectorAll('input[name="season"]');
            seasonRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        currentSeason = e.target.value;
                        updateSeasonDisplay();
                        localStorage.setItem('currentSeason', currentSeason);
                        scheduleAutoSync();
                    }
                });
            });

            // Generate adventurers wizard
            const generateAdventurersWizard = document.getElementById('generate-adventurers-wizard');
            if (generateAdventurersWizard) {
                generateAdventurersWizard.addEventListener('click', handleGenerateAdventurersWizard);
            }

            // Calendar event listeners
            setupCalendarEventListeners();
        }

        function updateAdventurersDisplay() {
            const adventurersContent = document.getElementById('adventurers-content');
            const saved = localStorage.getItem('adventurersGroup');

            if (saved && saved !== '""' && saved !== 'null') {
                try {
                    const adventurersData = JSON.parse(saved);
                    if (adventurersData && adventurersData.trim()) {
                        adventurersContent.innerHTML = parseMarkdown(adventurersData);
                    } else {
                        adventurersContent.innerHTML = '<p class="text-gray-400 italic">Aucune description d\'aventuriers définie.</p>';
                    }
                } catch (e) {
                    adventurersContent.innerHTML = '<p class="text-gray-400 italic">Aucune description d\'aventuriers définie.</p>';
                }
            } else {
                adventurersContent.innerHTML = '<p class="text-gray-400 italic">Aucune description d\'aventuriers définie.</p>';
            }
        }

        function updateQuestDisplay() {
            const questContent = document.getElementById('quest-content');
            const saved = localStorage.getItem('adventurersQuest');

            if (saved && saved !== '""' && saved !== 'null') {
                try {
                    const questData = JSON.parse(saved);
                    if (questData && questData.trim()) {
                        questContent.innerHTML = parseMarkdown(questData);
                    } else {
                        questContent.innerHTML = '<p class="text-gray-400 italic">Aucune description de quête définie.</p>';
                    }
                } catch (e) {
                    questContent.innerHTML = '<p class="text-gray-400 italic">Aucune description de quête définie.</p>';
                }
            } else {
                questContent.innerHTML = '<p class="text-gray-400 italic">Aucune description de quête définie.</p>';
            }
        }

        function parseMarkdown(text) {
            return text
                .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
                .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3">$1</h2>')
                .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2">$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
                .replace(/\n\n/g, '</p><p class="mb-3">')
                .replace(/\n/g, '<br>')
                .replace(/^(.*)/, '<p class="mb-3">$1')
                .concat('</p>');
        }

        async function handleGenerateAdventurersWizard(event) {
            const button = event.currentTarget;
            const adventurersTextarea = document.getElementById('adventurers-group');

            const prompt = `Génère un groupe de 2 à 5 aventuriers pour un jeu de rôle en Terre du Milieu (fin du Troisième Âge). Pour chaque personnage, indique :
- Nom et prénom
- Peuple (Hommes de l\'Eriador, Hobbits, Elfes, Nains, etc.)
- Occupation/Classe
- Brève description de personnalité
- Motivation pour participer à l\'aventure

Unite-les par un objectif commun crédible et évocateur. Style J.R.R. Tolkien, format Markdown.`;

            const result = await callGemini(prompt, button);
            adventurersTextarea.value = result;
        }

        function updateSeasonDisplay() {
            const seasonIndicator = document.getElementById('season-indicator');
            const currentSeasonText = document.getElementById('current-season-text');
            const currentSeasonSymbol = document.getElementById('current-season-symbol');

            const season = currentSeason.split('-')[0];
            const symbol = seasonSymbols[season] || '🌱';

            if (seasonIndicator) seasonIndicator.textContent = symbol;
            if (currentSeasonText) currentSeasonText.textContent = seasonNames[currentSeason] || 'Printemps-début';
            if (currentSeasonSymbol) currentSeasonSymbol.textContent = symbol;
        }

        function setupCalendarEventListeners() {
            const uploadBtn = document.getElementById('upload-calendar-btn');
            const fileInput = document.getElementById('calendar-file-input');
            const exportBtn = document.getElementById('export-calendar-btn');
            const monthSelect = document.getElementById('calendar-month-select');
            const daySelect = document.getElementById('calendar-day-select');

            if (uploadBtn && fileInput) {
                uploadBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', handleCalendarUpload);
            }

            if (exportBtn) {
                exportBtn.addEventListener('click', exportCalendar);
            }

            if (monthSelect) {
                monthSelect.addEventListener('change', handleMonthChange);
            }

            if (daySelect) {
                daySelect.addEventListener('change', handleDayChange);
            }

            // Season and calendar indicator click listeners
            const seasonIndicator = document.getElementById('season-indicator');
            const calendarDateIndicator = document.getElementById('calendar-date-indicator');

            if (seasonIndicator) {
                seasonIndicator.addEventListener('click', () => {
                    const settingsModal = document.getElementById('settings-modal');
                    settingsModal.classList.remove('hidden');
                    activateTab('season');
                });
            }

            if (calendarDateIndicator) {
                calendarDateIndicator.addEventListener('click', () => {
                    const settingsModal = document.getElementById('settings-modal');
                    settingsModal.classList.remove('hidden');
                    activateTab('season');
                });
            }
        }

        function handleCalendarUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const csvContent = e.target.result;
                    const calendar = parseCalendarCSV(csvContent);

                    calendarData = calendar;
                    localStorage.setItem('calendarData', JSON.stringify(calendar));

                    updateCalendarUI();
                    updateCalendarStatusDisplay();

                    alert(`Calendrier importé avec succès ! ${calendar.length} entrées.`);
                    scheduleAutoSync();
                } catch (error) {
                    alert(`Erreur lors de l'import du calendrier: ${error.message}`);
                }
            };
            reader.readAsText(file);
        }

        function parseCalendarCSV(csvContent) {
            const lines = csvContent.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());

            const calendar = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length >= headers.length) {
                    const entry = {};
                    headers.forEach((header, index) => {
                        entry[header] = values[index];
                    });
                    calendar.push(entry);
                }
            }

            return calendar;
        }

        function updateCalendarUI() {
            const monthSelect = document.getElementById('calendar-month-select');
            const dateSelector = document.getElementById('calendar-date-selector');

            if (calendarData && calendarData.length > 0) {
                // Extract unique months
                const months = [...new Set(calendarData.map(entry => entry.Month || entry.Mois))].filter(Boolean);

                monthSelect.innerHTML = '<option value="">Sélectionner un mois</option>';
                months.forEach(month => {
                    monthSelect.innerHTML += `<option value="${month}">${month}</option>`;
                });

                dateSelector.classList.remove('hidden');
            } else {
                dateSelector.classList.add('hidden');
            }
        }

        function updateCalendarStatusDisplay() {
            const statusText = document.getElementById('calendar-status-text');
            const modeInfo = document.getElementById('season-mode-info');

            if (calendarData && calendarData.length > 0) {
                statusText.textContent = `Calendrier chargé : ${calendarData.length} entrées`;
                statusText.className = 'text-green-400';
                modeInfo.textContent = 'Mode calendrier : les saisons sont synchronisées avec les dates du calendrier importé.';
            } else {
                statusText.textContent = 'Aucun calendrier chargé';
                statusText.className = 'text-gray-400';
                modeInfo.textContent = 'Mode manuel : sélectionnez une saison. Importez un calendrier CSV pour synchroniser automatiquement les saisons avec les dates.';
            }
        }

        function handleMonthChange(event) {
            const selectedMonth = event.target.value;
            const daySelect = document.getElementById('calendar-day-select');

            if (selectedMonth && calendarData) {
                const daysInMonth = calendarData
                    .filter(entry => (entry.Month || entry.Mois) === selectedMonth)
                    .map(entry => entry.Day || entry.Jour)
                    .filter(Boolean);

                daySelect.innerHTML = '<option value="">Sélectionner un jour</option>';
                daysInMonth.forEach(day => {
                    daySelect.innerHTML += `<option value="${day}">${day}</option>`;
                });
            } else {
                daySelect.innerHTML = '<option value="">Sélectionner un jour</option>';
            }
        }

        function handleDayChange(event) {
            const selectedDay = event.target.value;
            const monthSelect = document.getElementById('calendar-month-select');
            const selectedMonth = monthSelect.value;

            if (selectedMonth && selectedDay && calendarData) {
                const calendarEntry = calendarData.find(entry => 
                    (entry.Month || entry.Mois) === selectedMonth && 
                    (entry.Day || entry.Jour) === selectedDay
                );

                if (calendarEntry) {
                    currentCalendarDate = { month: selectedMonth, day: selectedDay };
                    localStorage.setItem('currentCalendarDate', JSON.stringify(currentCalendarDate));

                    // Update season based on calendar entry if available
                    const season = calendarEntry.Season || calendarEntry.Saison;
                    if (season) {
                        currentSeason = season;
                        localStorage.setItem('currentSeason', currentSeason);
                    }

                    updateCalendarDateDisplay();
                    updateSeasonDisplay();
                    scheduleAutoSync();
                }
            }
        }

        function updateCalendarDateDisplay() {
            const calendarDateIndicator = document.getElementById('calendar-date-indicator');
            const currentCalendarDateDisplay = document.getElementById('current-calendar-date');

            if (currentCalendarDate) {
                const dateText = `${currentCalendarDate.day} ${currentCalendarDate.month}`;
                if (calendarDateIndicator) calendarDateIndicator.textContent = dateText;
                if (currentCalendarDateDisplay) currentCalendarDateDisplay.textContent = dateText;
            }
        }

        function exportCalendar() {
            if (!calendarData || calendarData.length === 0) {
                alert('Aucun calendrier à exporter.');
                return;
            }

            const csvContent = convertCalendarToCSV(calendarData);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'calendrier-terre-du-milieu.csv';
            a.click();

            URL.revokeObjectURL(url);
        }

        function convertCalendarToCSV(calendar) {
            if (calendar.length === 0) return '';

            const headers = Object.keys(calendar[0]);
            const csvRows = [headers.join(',')];

            calendar.forEach(entry => {
                const values = headers.map(header => entry[header] || '');
                csvRows.push(values.join(','));
            });

            return csvRows.join('\n');
        }

        function loadSavedSettings() {
            // Load adventurers
            updateAdventurersDisplay();

            // Load quest
            updateQuestDisplay();

            // Load season
            const savedSeason = localStorage.getItem('currentSeason');
            if (savedSeason) {
                currentSeason = savedSeason;
                // Update radio button
                const seasonRadio = document.querySelector(`input[name="season"][value="${currentSeason}"]`);
                if (seasonRadio) seasonRadio.checked = true;
            }
            updateSeasonDisplay();

            // Load calendar
            const savedCalendar = localStorage.getItem('calendarData');
            const savedCalendarDate = localStorage.getItem('currentCalendarDate');

            if (savedCalendar) {
                try {
                    calendarData = JSON.parse(savedCalendar);
                    updateCalendarUI();
                } catch (e) {
                    console.error('Failed to load calendar data:', e);
                }
            }

            if (savedCalendarDate) {
                try {
                    currentCalendarDate = JSON.parse(savedCalendarDate);
                    updateCalendarDateDisplay();
                } catch (e) {
                    console.error('Failed to load calendar date:', e);
                }
            }

            updateCalendarStatusDisplay();

            // Load narration style
            const savedNarrationStyle = localStorage.getItem('narrationStyle');
            if (savedNarrationStyle) {
                const narrationRadio = document.querySelector(`input[name="narration-style"][value="${savedNarrationStyle}"]`);
                if (narrationRadio) narrationRadio.checked = true;
            }

            // Load narration style listeners
            const narrationRadios = document.querySelectorAll('input[name="narration-style"]');
            narrationRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        localStorage.setItem('narrationStyle', e.target.value);
                        scheduleAutoSync();
                    }
                });
            });
        }

        function getNarrationPromptAddition() {
            const narrationStyle = localStorage.getItem('narrationStyle') || 'brief';

            switch (narrationStyle) {
                case 'detailed':
                    return '\n\nStyle de narration : Rédige plusieurs paragraphes détaillés par jour dans un style littéraire évocateur et immersif.';
                case 'keywords':
                    return '\n\nStyle de narration : Fournis seulement des mots-clés évocateurs et des éléments d\'inspiration pour le Meneur de Jeu, pas de paragraphes complets.';
                case 'brief':
                default:
                    return '\n\nStyle de narration : Rédige un paragraphe unique par jour dans un style concis mais évocateur.';
            }
        }

        // --- Auto-sync Functions ---
        function enableAutoSync() {
            console.log("✅ Auto-sync activé");
            autoSyncEnabled = true;
            updateSyncStatus();
        }

        function disableAutoSync() {
            console.log("❌ Auto-sync désactivé");
            autoSyncEnabled = false;
            updateSyncStatus();
        }

        function scheduleAutoSync() {
            if (!autoSyncEnabled || !currentUser) return;

            clearTimeout(window.autoSyncTimeout);
            window.autoSyncTimeout = setTimeout(() => {
                performAutoSync();
            }, SYNC_DELAY);
        }

        async function performAutoSync() {
            if (!autoSyncEnabled || !currentUser) return;

            console.log("🔄 Auto-sync: Synchronisation automatique...");

            const currentData = {
                locations: locationsData,
                regions: regionsData,
                scale: scale,
                panX: panX,
                panY: panY,
                activeFilters: activeFilters,
                filters: activeFilters,
                journeyPath: journeyPath,
                totalPathPixels: totalPathPixels,
                startPoint: startPoint,
                lastPoint: lastPoint,
                journeyDiscoveries: journeyDiscoveries,
                currentSeason: currentSeason,
                calendarData: calendarData,
                currentCalendarDate: currentCalendarDate
            };

            try {
                const response = await fetch('/api/user/data', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(currentData)
                });

                if (response.ok) {
                    lastSyncTime = Date.now();
                    updateSyncStatus();
                    console.log("✅ Auto-sync: Synchronisation réussie");
                } else {
                    console.warn("⚠️ Auto-sync: Échec de la synchronisation");
                }
            } catch (error) {
                console.error("❌ Auto-sync: Erreur de synchronisation:", error);
            }
        }

        function updateSyncStatus() {
            // Update UI to show sync status if needed
            const syncStatusText = autoSyncEnabled ? 
                `Synchronisation automatique activée. Dernière sync: ${lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'jamais'}` :
                'Synchronisation automatique désactivée.';

            console.log(`🔄 Sync Status: ${syncStatusText}`);
        }

        function activateTab(tabName) {
            // For settings tabs
            const settingsTabButtons = document.querySelectorAll('.settings-tab-button');
            const settingsTabContents = document.querySelectorAll('.settings-tab-content');

            if (settingsTabButtons.length > 0) {
                settingsTabButtons.forEach(btn => btn.classList.remove('active'));
                settingsTabContents.forEach(content => content.style.display = 'none');

                const targetButton = document.querySelector(`[data-tab="${tabName}"].settings-tab-button`);
                const targetContent = document.getElementById(`${tabName}-tab`);

                if (targetButton && targetContent) {
                    targetButton.classList.add('active');
                    targetContent.style.display = 'flex';
                }
            }

            // For info box tabs
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');

            if (tabButtons.length > 0) {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                const targetTabButton = document.querySelector(`[data-tab="${tabName}"].tab-button`);
                const targetTabContent = document.getElementById(`${tabName}-tab`);

                if (targetTabButton && targetTabContent) {
                    targetTabButton.classList.add('active');
                    targetTabContent.classList.add('active');
                }
            }
        }

        // --- Initial Load ---
        document.addEventListener('DOMContentLoaded', () => {
            console.log("🌍 Document loaded, initializing application...");
            loadMapsData();
            loadRegionsFromLocal();
            loadFiltersFromLocal(); // Load filters early to set up UI correctly
            setupMapsEventListeners();
            setupFilters();
            setupSettingsEventListeners(); // Setup settings listeners early

            if (mapImage.complete) {
                initializeMap();
            } else {
                mapImage.addEventListener('load', initializeMap);
            }
            mapImage.addEventListener('error', handleImageError);

            // Fetch and check authentication status on load
            checkAuthStatus();
            checkAuthError(); // Check for auth-related errors in the URL

            // Setup button event listeners
            saveContextBtn.addEventListener('click', saveCurrentContext);
            googleSigninBtn.addEventListener('click', handleGoogleSignIn);
            authBtn.addEventListener('click', toggleAuthModal);
            closeAuthModalBtn.addEventListener('click', toggleAuthModal);

            // Initialize the season display based on saved or default season
            updateSeasonDisplay();
            updateCalendarDateDisplay(); // Ensure calendar date is displayed if loaded

            // Load saved data after initial setup
            loadSavedSettings();

            // Display initial map state
            renderMapsGrid();

            // Initial rendering of locations and regions based on loaded filters
            renderLocations();
            const showRegionsInitial = document.getElementById('filter-show-regions').checked;
            if (showRegionsInitial) {
                renderRegions();
            } else {
                regionsLayer.style.display = 'none';
            }

            console.log("✅ Application initialized successfully.");
        });