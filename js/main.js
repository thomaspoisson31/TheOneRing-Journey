// ===================================================================================
//  APPLICATION SETUP & MODULES
// ===================================================================================

(function() {
    'use strict';

    // --- Application State Manager ---
    const appState = {
        interactionMode: 'pan', // 'pan', 'draw', 'addLocation', 'addRegion'
        activeItemId: null,
        currentUser: null,
        isPlayerView: true,
        isCalendarMode: false,
        autoSyncEnabled: false,
        lastSyncTime: 0,
        locationsData: { locations: [] },
        regionsData: { regions: [] },
        calendarData: null,
        currentCalendarDate: null, // { month: "Gwaeron", day: 1 }
        currentSeason: 'printemps-debut',
        activeFilters: { known: false, visited: false, colors: [] }
    };

    // --- DOM Elements Cache ---
    const dom = {
        // Main viewport
        viewport: document.getElementById('viewport'),
        mapContainer: document.getElementById('map-container'),
        mapImage: document.getElementById('map-image'),
        loremasterMapImage: document.getElementById('loremaster-map-image'),
        drawingCanvas: document.getElementById('drawing-canvas'),
        locationsLayer: document.getElementById('locations-layer'),
        regionsLayer: document.getElementById('regions-layer'),
        loaderOverlay: document.getElementById('loader-overlay'),

        // Info Box
        infoBox: document.getElementById('info-box'),
        infoBoxTitle: document.getElementById('info-box-title'),
        infoBoxClose: document.getElementById('info-box-close'),
        infoBoxExpand: document.getElementById('info-box-expand'),
        infoBoxDelete: document.getElementById('info-box-delete'),
        infoBoxTabs: {
            image: document.getElementById('image-tab'),
            text: document.getElementById('text-tab'),
            rumeurs: document.getElementById('rumeurs-tab'),
            tradition: document.getElementById('tradition-tab'),
            tables: document.getElementById('tables-tab'),
            jsonTables: document.getElementById('json-tables-tab')
        },
        infoBoxScrollWrapper: document.getElementById('info-box-scroll-wrapper'),

        // Toolbar & Panels
        distanceContainer: document.getElementById('distance-container'),
        distanceDisplay: document.getElementById('distance-display'),
        filterPanel: document.getElementById('filter-panel'),
        mapSwitchBtn: document.getElementById('map-switch'),
        seasonIndicator: document.getElementById('season-indicator'),
        calendarDateIndicator: document.getElementById('calendar-date-indicator'),

        // Modals
        addLocationModal: document.getElementById('add-location-modal'),
        addRegionModal: document.getElementById('add-region-modal'),
        journeyLogModal: document.getElementById('journey-log-modal'),
        authModal: document.getElementById('auth-modal'),
        settingsModal: document.getElementById('settings-modal'),
        voyageSegmentsModal: document.getElementById('voyage-segments-modal'),

        // Auth
        authBtn: document.getElementById('auth-btn'),
        authStatusPanel: document.getElementById('auth-status-panel'),
        authContentPanel: document.getElementById('auth-content-panel'),
        loggedInPanel: document.getElementById('logged-in-panel'),
        loggedOutPanel: document.getElementById('logged-out-panel'),
        authUserName: document.getElementById('auth-user-name'),
        contextNameInput: document.getElementById('context-name-input'),
        savedContextsDiv: document.getElementById('saved-contexts')
    };
    const ctx = dom.drawingCanvas.getContext('2d');

    // --- Constants ---
    const CONSTANTS = {
        MAP_DISTANCE_MILES: 1150,
        PLAYER_MAP_URL: "fr_tor_2nd_eriadors_map_page-0001.webp",
        LOREMASTER_MAP_URL: "fr_tor_2nd_eriadors_map_page_loremaster.webp",
        LOCATIONS_URL: "Landmarks1.json",
        PROXIMITY_DISTANCE: 50,
        SYNC_DELAY: 2000,
        COLOR_MAP: { red: 'rgba(239, 68, 68, 0.8)', blue: 'rgba(59, 130, 246, 0.8)', green: 'rgba(34, 197, 94, 0.8)', violet: 'rgba(139, 92, 246, 0.8)', orange: 'rgba(252, 169, 3, 0.8)', black: 'rgba(17, 24, 39, 0.8)' },
        REGION_COLOR_MAP: { red: 'rgba(239, 68, 68, 0.15)', blue: 'rgba(59, 130, 246, 0.15)', green: 'rgba(34, 197, 94, 0.15)', violet: 'rgba(139, 92, 246, 0.15)', orange: 'rgba(252, 169, 3, 0.15)', black: 'rgba(17, 24, 39, 0.15)' },
        SEASON_SYMBOLS: { printemps: '🌱', ete: '☀️', automne: '🍂', hiver: '❄️' },
        SEASON_NAMES: { 'printemps-debut': 'Printemps-début', 'printemps-milieu': 'Printemps-milieu', 'printemps-fin': 'Printemps-fin', 'ete-debut': 'Été-début', 'ete-milieu': 'Été-milieu', 'ete-fin': 'Été-fin', 'automne-debut': 'Automne-début', 'automne-milieu': 'Automne-milieu', 'automne-fin': 'Automne-fin', 'hiver-debut': 'Hiver-début', 'hiver-milieu': 'Hiver-milieu', 'hiver-fin': 'Hiver-fin' }
    };


    // ===================================================================================
    //  DATA MANAGER
    // ===================================================================================
    const dataManager = {
        scheduleAutoSync: () => {
            if (!appState.autoSyncEnabled || !appState.currentUser) return;
            clearTimeout(window.autoSyncTimeout);
            window.autoSyncTimeout = setTimeout(() => {
                dataManager.autoSyncUserData();
            }, CONSTANTS.SYNC_DELAY);
        },

        autoSyncUserData: async () => {
            // Placeholder for actual sync logic if it were implemented server-side
            console.log("🔄 Auto-syncing user data (simulated)...");
            // In a real scenario, this would make a fetch request.
            // For now, it just saves to localStorage to ensure data persistence.
            dataManager.saveAllToLocal();
            uiManager.updateSyncStatus("Données synchronisées localement.");
        },

        loadInitialData: async () => {
            console.log("Attempting to load data...");
            // Load locations
            const savedLocations = localStorage.getItem('middleEarthLocations');
            if (savedLocations) {
                try {
                    appState.locationsData = JSON.parse(savedLocations);
                    console.log("✅ Loaded saved locations from localStorage.");
                } catch (e) {
                    console.error("Failed to parse saved locations.", e);
                    appState.locationsData = { locations: [] };
                }
            } else {
                 console.log("No saved locations found, loading defaults.");
                 try {
                     const response = await fetch(CONSTANTS.LOCATIONS_URL);
                     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                     const data = await response.json();
                     if (data?.locations) {
                         appState.locationsData = data;
                         dataManager.saveLocationsToLocal();
                         console.log("✅ Loaded default locations from URL.");
                     }
                 } catch (error) {
                     console.error("❌ Error fetching locations, using empty list.", error);
                     appState.locationsData = { locations: [] };
                 }
            }

            // Load regions
            const savedRegions = localStorage.getItem('middleEarthRegions');
            if (savedRegions) {
                try {
                    appState.regionsData = JSON.parse(savedRegions);
                } catch(e) {
                    appState.regionsData = { regions: [] };
                }
            }
        },

        saveLocationsToLocal: () => {
            localStorage.setItem('middleEarthLocations', JSON.stringify(appState.locationsData));
            dataManager.scheduleAutoSync();
        },

        saveRegionsToLocal: () => {
            localStorage.setItem('middleEarthRegions', JSON.stringify(appState.regionsData));
            dataManager.scheduleAutoSync();
        },

        saveAllToLocal: () => {
            dataManager.saveLocationsToLocal();
            dataManager.saveRegionsToLocal();
            settingsManager.saveFiltersToLocal();
            settingsManager.calendar.saveToLocal();
            localStorage.setItem('currentSeason', appState.currentSeason);
            // Add other data to sync as needed
        },

        getItemById: (id, type) => {
            const dataArray = (type === 'location') ? appState.locationsData.locations : appState.regionsData.regions;
            return dataArray.find(item => item.id === id);
        },

        deleteItem: (id, type) => {
            if (confirm(`Êtes-vous sûr de vouloir supprimer cet élément ?`)) {
                let dataArray = (type === 'location') ? appState.locationsData.locations : appState.regionsData.regions;
                const itemIndex = dataArray.findIndex(item => item.id === id);
                if (itemIndex !== -1) {
                    dataArray.splice(itemIndex, 1);
                    if (type === 'location') {
                        dataManager.saveLocationsToLocal();
                        renderer.renderLocations();
                    } else {
                        dataManager.saveRegionsToLocal();
                        renderer.renderRegions();
                    }
                    infoBoxManager.hide();
                }
            }
        },

        exportUnifiedData: () => {
            const unifiedData = {
                locations: [...appState.locationsData.locations],
                regions: [...appState.regionsData.regions]
            };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(unifiedData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "Eriador_Data.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        },

        importUnifiedData: (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    const importedLocations = importedData.locations || [];
                    const importedRegions = importedData.regions || [];

                    const shouldReplace = confirm(`Le fichier contient ${importedLocations.length} lieux et ${importedRegions.length} régions.\n\nVoulez-vous remplacer les données actuelles (OK) ou les fusionner (Annuler) ?`);

                    const merge = (existingItems, newItems) => {
                        newItems.forEach(newItem => {
                            const existingIndex = existingItems.findIndex(item => item.id === newItem.id || item.name === newItem.name);
                            if (existingIndex > -1) {
                                existingItems[existingIndex] = { ...existingItems[existingIndex], ...newItem };
                            } else {
                                newItem.id = newItem.id || Date.now() + Math.random();
                                existingItems.push(newItem);
                            }
                        });
                    };

                    if (shouldReplace) {
                        appState.locationsData.locations = importedLocations;
                        appState.regionsData.regions = importedRegions;
                    } else {
                        merge(appState.locationsData.locations, importedLocations);
                        merge(appState.regionsData.regions, importedRegions);
                    }

                    dataManager.saveAllToLocal();
                    renderer.renderAll();
                    alert("Importation terminée !");

                } catch (err) {
                    alert("Erreur lors de la lecture du fichier JSON : " + err.message);
                } finally {
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        }
    };

    // ===================================================================================
    //  MAP MANAGER
    // ===================================================================================
    const mapManager = {
        scale: 1,
        panX: 0,
        panY: 0,
        isPanning: false,
        startPanX: 0,
        startPanY: 0,
        draggedMarker: null,
        dragStartX: 0,
        dragStartY: 0,
        MAP_WIDTH: 0,
        MAP_HEIGHT: 0,

        initialize: () => {
            mapManager.MAP_WIDTH = dom.mapImage.naturalWidth;
            mapManager.MAP_HEIGHT = dom.mapImage.naturalHeight;
            if (mapManager.MAP_WIDTH === 0) {
                console.warn("Map image not ready, retrying init...");
                setTimeout(mapManager.initialize, 100);
                return;
            }

            console.log(`🗺️ Map initialized with dimensions: ${mapManager.MAP_WIDTH}x${mapManager.MAP_HEIGHT}`);

            dom.mapContainer.style.width = `${mapManager.MAP_WIDTH}px`;
            dom.mapContainer.style.height = `${mapManager.MAP_HEIGHT}px`;
            dom.drawingCanvas.width = mapManager.MAP_WIDTH;
            dom.drawingCanvas.height = mapManager.MAP_HEIGHT;
            dom.regionsLayer.setAttribute('viewBox', `0 0 ${mapManager.MAP_WIDTH} ${mapManager.MAP_HEIGHT}`);

            ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            renderer.renderAll();
            mapManager.resetView();

            dom.mapImage.classList.remove('opacity-0');
            dom.loaderOverlay.style.opacity = '0';
            setTimeout(() => { dom.loaderOverlay.style.display = 'none'; }, 500);

            // Preload loremaster map
            const lmImage = new Image();
            lmImage.src = CONSTANTS.LOREMASTER_MAP_URL;
            lmImage.onload = () => {
                dom.loremasterMapImage.src = CONSTANTS.LOREMASTER_MAP_URL;
                dom.mapSwitchBtn.classList.remove('hidden');
            };
        },

        applyTransform: () => {
            dom.mapContainer.style.transform = `translate(${mapManager.panX}px, ${mapManager.panY}px) scale(${mapManager.scale})`;
        },

        resetView: () => {
            const viewportWidth = dom.viewport.clientWidth;
            if (viewportWidth > 0 && mapManager.MAP_WIDTH > 0) {
                mapManager.scale = viewportWidth / mapManager.MAP_WIDTH;
                mapManager.panX = 0;
                mapManager.panY = 0;
                mapManager.applyTransform();
            }
        },

        handleWheel: (event) => {
            event.preventDefault();
            const zoomIntensity = 0.1;
            const wheel = event.deltaY < 0 ? 1 : -1;
            const zoom = Math.exp(wheel * zoomIntensity);
            const rect = dom.viewport.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            mapManager.panX = mouseX - (mouseX - mapManager.panX) * zoom;
            mapManager.panY = mouseY - (mouseY - mapManager.panY) * zoom;
            mapManager.scale = Math.max(0.1, Math.min(mapManager.scale * zoom, 5));
            mapManager.applyTransform();
        },

        getCanvasCoordinates: (event) => {
            const rect = dom.mapContainer.getBoundingClientRect();
            const x = (event.clientX - rect.left) / mapManager.scale;
            const y = (event.clientY - rect.top) / mapManager.scale;
            return { x, y };
        },

        startDragMarker: (e) => {
            e.stopPropagation();
            mapManager.draggedMarker = e.target;
            mapManager.dragStartX = e.clientX;
            mapManager.dragStartY = e.clientY;
            document.addEventListener('mousemove', mapManager.dragMarker);
            document.addEventListener('mouseup', mapManager.stopDragMarker, { once: true });
        },

        dragMarker: (e) => {
            if (!mapManager.draggedMarker) return;
            const deltaX = (e.clientX - mapManager.dragStartX) / mapManager.scale;
            const deltaY = (e.clientY - mapManager.dragStartY) / mapManager.scale;
            mapManager.draggedMarker.style.left = `${parseFloat(mapManager.draggedMarker.style.left) + deltaX}px`;
            mapManager.draggedMarker.style.top = `${parseFloat(mapManager.draggedMarker.style.top) + deltaY}px`;
            mapManager.dragStartX = e.clientX;
            mapManager.dragStartY = e.clientY;
        },

        stopDragMarker: () => {
            if (!mapManager.draggedMarker) return;
            document.removeEventListener('mousemove', mapManager.dragMarker);
            const locationId = parseInt(mapManager.draggedMarker.dataset.id, 10);
            const location = dataManager.getItemById(locationId, 'location');
            if (location) {
                location.coordinates.x = parseFloat(mapManager.draggedMarker.style.left);
                location.coordinates.y = parseFloat(mapManager.draggedMarker.style.top);
                dataManager.saveLocationsToLocal();
            }
            mapManager.draggedMarker = null;
        }
    };

    // ===================================================================================
    //  RENDERER
    // ===================================================================================
    const renderer = {
        renderAll: () => {
            renderer.renderLocations();
            renderer.renderRegions();
        },

        renderLocations: () => {
            dom.locationsLayer.innerHTML = '';
            const filtered = appState.locationsData.locations.filter(location => {
                if (!location.coordinates?.x || !location.coordinates?.y) return false;
                const knownMatch = !appState.activeFilters.known || location.known;
                const visitedMatch = !appState.activeFilters.visited || location.visited;
                const colorMatch = appState.activeFilters.colors.length === 0 || appState.activeFilters.colors.includes(location.color);
                return knownMatch && visitedMatch && colorMatch;
            });

            filtered.forEach(location => {
                const marker = document.createElement('div');
                marker.className = 'location-marker';
                marker.style.left = `${location.coordinates.x}px`;
                marker.style.top = `${location.coordinates.y}px`;
                marker.style.backgroundColor = location.known ? (CONSTANTS.COLOR_MAP[location.color] || CONSTANTS.COLOR_MAP.red) : 'rgba(107, 114, 128, 0.7)';
                marker.style.borderColor = location.visited ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                marker.dataset.id = location.id;
                marker.dataset.type = 'location';
                marker.title = location.name;

                marker.style.pointerEvents = (appState.interactionMode === 'draw') ? 'none' : 'auto';
                dom.locationsLayer.appendChild(marker);
            });
        },

        renderRegions: () => {
            dom.regionsLayer.innerHTML = '';
            appState.regionsData.regions.forEach(region => {
                if (!region.points || region.points.length < 3) return;

                const pathData = `M ${region.points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.classList.add('region');
                path.style.fill = CONSTANTS.REGION_COLOR_MAP[region.color] || CONSTANTS.REGION_COLOR_MAP.green;
                path.style.stroke = CONSTANTS.COLOR_MAP[region.color] || CONSTANTS.COLOR_MAP.green;
                path.dataset.id = region.id;
                path.dataset.type = 'region';
                dom.regionsLayer.appendChild(path);
            });
        }
    };

    // ===================================================================================
    //  INFOBOX MANAGER
    // ===================================================================================
    const infoBoxManager = {
        newLocationCoords: null,

        show: (item, type) => {
            if (!item) return;
            appState.activeItemId = item.id;

            infoBoxManager._renderAllTabs(item, type);

            dom.infoBox.style.display = 'block';
            if (!dom.infoBox.classList.contains('expanded')) {
                dom.infoBox.classList.add('expanded'); // Default to expanded
            }
            infoBoxManager.updateLayout();

            infoBoxManager._setupEventListeners(type, item.id);
            infoBoxManager._setupTabSwitching();
            infoBoxManager.activateTab('image'); // Default to image tab
        },

        hide: () => {
            dom.infoBox.style.display = 'none';
            appState.activeItemId = null;
        },

        updateLayout: () => {
            const isExpanded = dom.infoBox.classList.contains('expanded');
            dom.infoBoxExpand.className = `fas ${isExpanded ? 'fa-compress' : 'fa-expand'}`;
            dom.infoBoxExpand.title = isExpanded ? 'Vue compacte' : 'Vue étendue';
            dom.infoBoxTitle.classList.toggle('hidden', !isExpanded);
            dom.infoBoxDelete.classList.toggle('hidden', !isExpanded);

            const activeItem = dataManager.getItemById(appState.activeItemId, infoBoxManager._getActiveType());
            if(activeItem) dom.infoBoxTitle.textContent = activeItem.name;

            if (isExpanded) {
                infoBoxManager._positionExpanded();
            } else {
                infoBoxManager._positionCompact();
            }
        },

        toggleExpand: () => {
            dom.infoBox.classList.toggle('expanded');
            infoBoxManager.updateLayout();
            // Re-render tabs to adjust content for compact/expanded view
            const type = infoBoxManager._getActiveType();
            const item = dataManager.getItemById(appState.activeItemId, type);
            if(item) infoBoxManager._renderAllTabs(item, type);
        },

        _positionExpanded: () => {
            const vpRect = dom.viewport.getBoundingClientRect();
            const tbRect = document.getElementById('toolbar').getBoundingClientRect();
            const margin = 16;
            const desiredWidth = Math.floor(vpRect.width * 0.9);
            const desiredHeight = Math.floor(vpRect.height * 0.9);
            const availableRight = Math.floor(vpRect.width - (tbRect.right - vpRect.left) - margin);
            const finalWidth = Math.min(desiredWidth, availableRight);
            const minLeft = Math.max(margin, tbRect.right - vpRect.left + margin);
            const left = Math.max(Math.floor((vpRect.width - finalWidth) / 2), minLeft);
            const top = Math.floor((vpRect.height - desiredHeight) / 2);

            Object.assign(dom.infoBox.style, { left: `${left}px`, top: `${top}px`, width: `${finalWidth}px`, height: `${desiredHeight}px`, maxWidth: 'none' });
            Object.assign(dom.infoBoxScrollWrapper.style, { maxHeight: 'none', height: 'calc(100% - 3rem)' });
        },

        _positionCompact: () => {
            // Simplified positioning for compact mode
            Object.assign(dom.infoBox.style, { left: ``, top: ``, width: '', height: '', maxWidth: '280px' });
            Object.assign(dom.infoBoxScrollWrapper.style, { maxHeight: '250px', height: '' });
        },

        _getActiveType: () => {
             // Heuristic to determine type based on active ID
             if (appState.regionsData.regions.some(r => r.id === appState.activeItemId)) return 'region';
             return 'location';
        },

        _renderAllTabs: (item, type) => {
            const isExpanded = dom.infoBox.classList.contains('expanded');
            const compactTitleHtml = isExpanded ? '' : `<div class="compact-title"><span style="font-family: 'Merriweather', serif;">${helpers.escapeHtml(item.name)}</span></div>`;
            const images = helpers.getImages(item);

            // Image Tab
            if (images.length > 0) {
                 dom.infoBoxTabs.image.innerHTML = `
                    <div class="image-view">
                        ${compactTitleHtml}
                        <img src="${helpers.getDefaultImage(item)}" alt="${helpers.escapeHtml(item.name)}" class="modal-image" onerror="this.parentElement.innerHTML = '<div class=\\'image-placeholder\\'>Image introuvable</div>'">
                    </div>`;
            } else {
                 dom.infoBoxTabs.image.innerHTML = isExpanded ? `<div class="image-placeholder">Aucune image</div>` : compactTitleHtml;
            }

            // Text Tab
            dom.infoBoxTabs.text.innerHTML = `
                <div class="text-view">
                    <h3>${helpers.escapeHtml(item.name)}</h3>
                    <p>${helpers.escapeHtml(item.description || 'Aucune description.')}</p>
                </div>`;

            // Rumeurs Tab
            let rumeursContent = '';
            const rumeurs = item.Rumeurs || (item.Rumeur ? [item.Rumeur] : []);
            if (rumeurs.length > 0) {
                rumeursContent = `<div class="mt-4 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg p-4">
                    <div class="font-bold text-yellow-300 mb-2"><i class="fas fa-ear-listen mr-2"></i> ${rumeurs.length > 1 ? 'Rumeurs' : 'Rumeur'}</div>
                    ${rumeurs.map(r => `<div class="text-yellow-100 text-sm italic leading-relaxed">${helpers.escapeHtml(r)}</div>`).join('<hr class="border-yellow-600/50 my-2">')}
                </div>`;
            } else {
                rumeursContent = `<p class="text-gray-500 italic">Aucune rumeur connue.</p>`;
            }
            dom.infoBoxTabs.rumeurs.innerHTML = `<div class="text-view">${rumeursContent}</div>`;

            // Tradition Tab
            dom.infoBoxTabs.tradition.innerHTML = `
                 <div class="text-view">
                    <h3>Tradition Ancienne</h3>
                    <p>${helpers.escapeHtml(item.Tradition_Ancienne || 'Aucune tradition ancienne connue.')}</p>
                </div>`;

            // Tables & JSON Tables
            infoBoxManager._renderTableTab(dom.infoBoxTabs.tables, helpers.getTables(item), item.name, "Table", isExpanded);
            infoBoxManager._renderJsonTableTab(dom.infoBoxTabs.jsonTables, helpers.getJsonTables(item), item.name, "Table Texte", isExpanded);
        },

        _renderTableTab: (tabElement, tables, itemName, itemType, isExpanded) => {
            if (tables.length > 0) {
                const defaultTable = helpers.getDefaultTable(tables);
                const compactTitle = isExpanded ? '' : `<div class="compact-title"><span style="font-family: 'Merriweather', serif;">${itemType} - ${helpers.escapeHtml(itemName)}</span></div>`;
                tabElement.innerHTML = `
                    <div class="image-view">
                        ${compactTitle}
                        <img src="${defaultTable}" alt="${itemType} ${helpers.escapeHtml(itemName)}" class="modal-image" onerror="this.parentElement.innerHTML = '<div class=\\'image-placeholder\\'>Table introuvable</div>'">
                    </div>`;
            } else {
                 tabElement.innerHTML = isExpanded ? `<div class="image-placeholder">Aucune table disponible</div>` : `<div class="compact-title"><span style="font-family: 'Merriweather', serif;">${itemType} - ${helpers.escapeHtml(itemName)}</span></div>`;
            }
        },

        _renderJsonTableTab: (tabElement, jsonTables, itemName, itemType, isExpanded) => {
            if (jsonTables.length > 0) {
                const defaultJsonTable = helpers.getDefaultJsonTable(jsonTables);
                const compactTitle = isExpanded ? '' : `<div class="compact-title"><span style="font-family: 'Merriweather', serif;">${itemType} - ${helpers.escapeHtml(itemName)}</span></div>`;
                tabElement.innerHTML = `
                    <div class="json-table-container">
                        ${compactTitle}
                        <div class="mb-3 flex justify-end">
                            <button class="generate-random-event-btn px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm" data-table-content='${helpers.escapeHtml(JSON.stringify(defaultJsonTable))}'>
                                <i class="fas fa-dice mr-1"></i>Générer un événement
                            </button>
                        </div>
                        <div class="random-event-display hidden mb-3 p-3 bg-yellow-800 bg-opacity-30 border border-yellow-600 rounded-lg">
                            <div class="font-bold text-yellow-300 mb-2">Événement généré :</div>
                            <div class="event-content text-yellow-100"></div>
                        </div>
                        ${helpers.formatJsonTableForDisplay(defaultJsonTable)}
                    </div>`;
            } else {
                 tabElement.innerHTML = isExpanded ? `<div class="image-placeholder">Aucune table texte disponible</div>` : `<div class="compact-title"><span style="font-family: 'Merriweather', serif;">${itemType} - ${helpers.escapeHtml(itemName)}</span></div>`;
            }
        },

        _setupEventListeners: (type, itemId) => {
            // Use event delegation on a static parent for dynamically created buttons
            const header = dom.infoBox.querySelector('.info-box-header');
            if (header._listener) {
                header.removeEventListener('click', header._listener);
            }
            header._listener = (event) => {
                const target = event.target.closest('button');
                if (!target) return;

                if (target.id === 'info-box-edit') infoBoxManager.enterEditMode();
                if (target.id === 'info-box-delete') dataManager.deleteItem(itemId, type);
                if (target.id === 'info-box-expand') infoBoxManager.toggleExpand();
                if (target.id === 'info-box-close') infoBoxManager.hide();
            };
            header.addEventListener('click', header._listener);
        },

        _setupTabSwitching: () => {
            const tabsContainer = dom.infoBox.querySelector('.info-box-tabs');
            if (tabsContainer._listener) {
                 tabsContainer.removeEventListener('click', tabsContainer._listener);
            }
            tabsContainer._listener = (event) => {
                const button = event.target.closest('.tab-button');
                if (button) {
                    infoBoxManager.activateTab(button.dataset.tab);
                }
            };
            tabsContainer.addEventListener('click', tabsContainer._listener);
        },

        activateTab: (tabName) => {
            dom.infoBox.querySelectorAll('.tab-button').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
            dom.infoBox.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === `${tabName}-tab`));
        },

        // --- ADD/EDIT MODES ---
        openAddLocationModal: (coords) => {
            infoBoxManager.newLocationCoords = coords;
            dom.addLocationModal.classList.remove('hidden');
            dom.addLocationModal.querySelector('#location-name-input').focus();
            appState.interactionMode = 'pan';
            document.getElementById('add-location-mode').classList.remove('btn-active');

            // Populate color picker
            const addColorPicker = document.getElementById('add-color-picker');
            addColorPicker.innerHTML = Object.keys(CONSTANTS.COLOR_MAP).map((color, index) => 
                `<div class="color-swatch ${index === 0 ? 'selected' : ''}" data-color="${color}" style="background-color: ${CONSTANTS.COLOR_MAP[color]}"></div>`
            ).join('');
        },

        confirmAddLocation: () => {
            const name = document.getElementById('location-name-input').value;
            const desc = document.getElementById('location-desc-input').value;
            const imageUrl = document.getElementById('location-image-input').value;
            const color = document.querySelector('#add-color-picker .selected').dataset.color;
            const known = document.getElementById('location-known-input').checked;
            const visited = document.getElementById('location-visited-input').checked;

            if (name && infoBoxManager.newLocationCoords) {
                const newLocation = { 
                    id: Date.now(), name, description: desc, imageUrl, color, known, visited,
                    type: "custom", coordinates: infoBoxManager.newLocationCoords,
                    Rumeurs: [], Tradition_Ancienne: "A définir"
                };
                appState.locationsData.locations.push(newLocation);
                renderer.renderLocations();
                dataManager.saveLocationsToLocal();
            }
            infoBoxManager.cancelAddLocation();
        },

        cancelAddLocation: () => {
            dom.addLocationModal.classList.add('hidden');
            dom.addLocationModal.querySelector('form').reset();
            infoBoxManager.newLocationCoords = null;
        }

    };

    // ===================================================================================
    //  JOURNEY MANAGER
    // ===================================================================================
    const journeyManager = {
        isDrawing: false,
        totalPathPixels: 0,
        lastPoint: null,
        startPoint: null,
        journeyPath: [],
        journeyDiscoveries: [],
        currentRegionPoints: [],
        tempRegionPath: null,

        startDrawing: (event) => {
            if (event.target.closest('.location-marker, #info-box')) return;
            event.preventDefault();
            event.stopPropagation();

            journeyManager.erasePath(); // Clear previous path

            journeyManager.isDrawing = true;
            journeyManager.startPoint = mapManager.getCanvasCoordinates(event);
            journeyManager.lastPoint = journeyManager.startPoint;
            journeyManager.journeyPath.push({ ...journeyManager.startPoint });

            ctx.beginPath();
            ctx.moveTo(journeyManager.lastPoint.x, journeyManager.lastPoint.y);

            uiManager.updateDistanceDisplay();
            dom.distanceContainer.classList.remove('hidden');
        },

        continueDrawing: (event) => {
            if (!journeyManager.isDrawing) return;

            const currentPoint = mapManager.getCanvasCoordinates(event);
            const segmentLength = Math.hypot(currentPoint.x - journeyManager.lastPoint.x, currentPoint.y - journeyManager.lastPoint.y);
            journeyManager.totalPathPixels += segmentLength;

            journeyManager.journeyPath.push({ ...currentPoint });
            journeyManager.lastPoint = currentPoint;

            ctx.lineTo(currentPoint.x, currentPoint.y);
            ctx.stroke();
            uiManager.updateDistanceDisplay();
        },

        stopDrawing: () => {
            if (journeyManager.isDrawing) {
                journeyManager.isDrawing = false;
                dataManager.scheduleAutoSync();
            }
        },

        erasePath: () => {
            ctx.clearRect(0, 0, dom.drawingCanvas.width, dom.drawingCanvas.height);
            Object.assign(journeyManager, { totalPathPixels: 0, startPoint: null, lastPoint: null, journeyPath: [], journeyDiscoveries: [] });
            uiManager.updateDistanceDisplay();
            dataManager.scheduleAutoSync();
        },

        updateJourneyInfo: () => {
            // Complex logic for discovery calculation can be placed here
            // For now, it just updates the display
            uiManager.displayJourneyInfo();
        }
    };

    // ===================================================================================
    //  UI MANAGER & EVENT HANDLERS
    // ===================================================================================
    const uiManager = {
        initialize: () => {
            uiManager.setupEventListeners();
            settingsManager.initialize();
        },

        setupEventListeners: () => {
            // Main Viewport Listeners
            dom.viewport.addEventListener('wheel', mapManager.handleWheel);
            dom.viewport.addEventListener('mousedown', uiManager.handleViewportMouseDown);
            dom.viewport.addEventListener('mousemove', uiManager.handleViewportMouseMove);
            ['mouseup', 'mouseleave'].forEach(evt => dom.viewport.addEventListener(evt, uiManager.handleViewportMouseUpLeave));
            dom.viewport.addEventListener('dblclick', uiManager.handleViewportDblClick);

            // Item Layer Listeners (Event Delegation)
            dom.locationsLayer.addEventListener('mousedown', uiManager.handleItemMouseDown);
            dom.locationsLayer.addEventListener('click', uiManager.handleItemClick);
            dom.regionsLayer.addEventListener('click', uiManager.handleItemClick);

            // Toolbar buttons
            document.getElementById('draw-mode').addEventListener('click', () => uiManager.setInteractionMode('draw'));
            document.getElementById('add-location-mode').addEventListener('click', () => uiManager.setInteractionMode('addLocation'));
            document.getElementById('add-region-mode').addEventListener('click', () => uiManager.setInteractionMode('addRegion'));
            document.getElementById('erase').addEventListener('click', journeyManager.erasePath);
            dom.mapSwitchBtn.addEventListener('click', uiManager.toggleMapView);

            // Modals
            document.getElementById('confirm-add-location').addEventListener('click', infoBoxManager.confirmAddLocation);
            document.getElementById('cancel-add-location').addEventListener('click', infoBoxManager.cancelAddLocation);
            document.getElementById('close-journey-log').addEventListener('click', () => dom.journeyLogModal.classList.add('hidden'));

            // File I/O
            document.getElementById('export-locations').addEventListener('click', dataManager.exportUnifiedData);
            const importInput = document.getElementById('import-file-input');
            document.getElementById('import-locations').addEventListener('click', () => importInput.click());
            importInput.addEventListener('change', dataManager.importUnifiedData);

            // Global listeners
            window.addEventListener('resize', () => { if (dom.infoBox.style.display === 'block') infoBoxManager.updateLayout(); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') infoBoxManager.hide(); });
        },

        setInteractionMode: (mode) => {
            // If clicking the same mode button again, toggle it off to 'pan' mode.
            if (appState.interactionMode === mode) {
                appState.interactionMode = 'pan';
            } else {
                appState.interactionMode = mode;
            }

            // Update UI
            document.querySelectorAll('.toolbar .btn-active').forEach(b => b.classList.remove('btn-active'));
            if (appState.interactionMode !== 'pan') {
                const activeButton = document.getElementById(`${mode}-mode`);
                if (activeButton) activeButton.classList.add('btn-active');
            }

            dom.viewport.className = `viewport ${appState.interactionMode}-active`;
            console.log(`Interaction mode set to: ${appState.interactionMode}`);
            renderer.renderLocations(); // Re-render to update pointer-events
        },

        handleViewportMouseDown: (event) => {
            // Prevent default browser actions like text selection
            if (appState.interactionMode === 'pan' || appState.interactionMode === 'draw') {
                 event.preventDefault();
            }

            // Don't do anything if clicking on an interactive element
            if (event.target.closest('.location-marker, .region, #info-box')) {
                return;
            }
            infoBoxManager.hide();

            switch (appState.interactionMode) {
                case 'pan':
                    mapManager.isPanning = true;
                    mapManager.startPanX = event.clientX - mapManager.panX;
                    mapManager.startPanY = event.clientY - mapManager.panY;
                    dom.viewport.classList.add('panning');
                    break;
                case 'draw':
                    journeyManager.startDrawing(event);
                    break;
                case 'addLocation':
                    infoBoxManager.openAddLocationModal(mapManager.getCanvasCoordinates(event));
                    break;
                case 'addRegion':
                    // Region logic here
                    break;
            }
        },

        handleViewportMouseMove: (event) => {
            if (mapManager.isPanning) {
                mapManager.panX = event.clientX - mapManager.startPanX;
                mapManager.panY = event.clientY - mapManager.startPanY;
                mapManager.applyTransform();
            } else if (appState.interactionMode === 'draw') {
                journeyManager.continueDrawing(event);
            }
        },

        handleViewportMouseUpLeave: () => {
            if (mapManager.isPanning) {
                mapManager.isPanning = false;
                dom.viewport.classList.remove('panning');
            }
            if (appState.interactionMode === 'draw') {
                journeyManager.stopDrawing();
            }
        },

        handleViewportDblClick: (event) => {
            if (appState.interactionMode === 'addRegion') {
                // Region completion logic
            }
        },

        handleItemMouseDown: (event) => {
             const marker = event.target.closest('.location-marker');
             if (marker && appState.interactionMode === 'pan') {
                 mapManager.startDragMarker(event);
             }
        },

        handleItemClick: (event) => {
            const itemElement = event.target.closest('[data-id]');
            if (!itemElement || appState.interactionMode !== 'pan') return;

            const itemId = parseInt(itemElement.dataset.id, 10);
            const itemType = itemElement.dataset.type;
            const item = dataManager.getItemById(itemId, itemType);

            if (item) {
                infoBoxManager.show(item, itemType);
            }
        },

        toggleMapView: () => {
            appState.isPlayerView = !appState.isPlayerView;
            dom.mapImage.style.opacity = appState.isPlayerView ? '1' : '0';
            dom.loremasterMapImage.style.opacity = appState.isPlayerView ? '0' : '1';
            const icon = document.getElementById('map-switch-icon');
            icon.className = appState.isPlayerView ? 'fas fa-book-open' : 'fas fa-users';
            dom.mapSwitchBtn.title = appState.isPlayerView ? "Vue Gardien" : "Vue Joueurs";
        },

        updateDistanceDisplay: () => {
             if (journeyManager.totalPathPixels === 0) {
                dom.distanceContainer.classList.add('hidden');
                return;
            }
            const miles = journeyManager.totalPathPixels * (CONSTANTS.MAP_DISTANCE_MILES / mapManager.MAP_WIDTH);
            const days = Math.ceil((miles / 20) * 2) / 2;
            dom.distanceDisplay.innerHTML = `<strong>${Math.round(miles)}</strong> miles &nbsp;|&nbsp;&nbsp; <strong>${days.toFixed(1)}</strong> jours`;
            journeyManager.updateJourneyInfo();
        },

        displayJourneyInfo: () => {
            // This function would contain the logic to display discovered locations/regions
            // Keeping it simple for this refactoring
            const list = document.getElementById('traversed-regions-list');
            list.innerHTML = 'Les découvertes du voyage apparaîtront ici.';
        },

        updateSyncStatus: (message) => {
             console.log(`🔄 Sync Status: ${message}`);
             const statusElement = document.getElementById('sync-status');
             if (statusElement) {
                 statusElement.textContent = message;
                 statusElement.style.opacity = '1';
                 setTimeout(() => { statusElement.style.opacity = '0'; }, 3000);
             }
        }
    };

    // ===================================================================================
    // SETTINGS MANAGER (Filters, Calendar, Seasons)
    // ===================================================================================
    const settingsManager = {
        initialize: () => {
            settingsManager.setupFilterEventListeners();
            settingsManager.loadFiltersFromLocal();
            settingsManager.calendar.loadFromLocal();
            settingsManager.loadSavedSeason();
        },

        // --- Filters ---
        setupFilterEventListeners: () => {
             const colorPicker = document.getElementById('filter-color-picker');
             colorPicker.innerHTML = Object.keys(CONSTANTS.COLOR_MAP).map(color => `
                <label title="${color.charAt(0).toUpperCase() + color.slice(1)}" class="relative cursor-pointer">
                    <input type="checkbox" data-color="${color}" class="filter-color-checkbox sr-only peer">
                    <div class="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-white" style="background-color: ${CONSTANTS.COLOR_MAP[color]}"></div>
                </label>
            `).join('');

            const filterPanel = document.getElementById('filter-panel');
            filterPanel.addEventListener('change', settingsManager.updateFilters);
            document.getElementById('reset-filters').addEventListener('click', settingsManager.resetFilters);
            document.getElementById('filter-toggle').addEventListener('click', (e) => {
                e.stopPropagation();
                filterPanel.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!filterPanel.contains(e.target) && !document.getElementById('filter-toggle').contains(e.target)) {
                    filterPanel.classList.add('hidden');
                }
            });
        },

        updateFilters: () => {
            appState.activeFilters.known = document.getElementById('filter-known').checked;
            appState.activeFilters.visited = document.getElementById('filter-visited').checked;
            appState.activeFilters.colors = [...document.querySelectorAll('.filter-color-checkbox:checked')].map(cb => cb.dataset.color);

            renderer.renderLocations();

            const showRegions = document.getElementById('filter-show-regions').checked;
            dom.regionsLayer.style.display = showRegions ? 'block' : 'none';

            settingsManager.saveFiltersToLocal();
            dataManager.scheduleAutoSync();
        },

        resetFilters: () => {
            document.getElementById('filter-form').reset();
            settingsManager.updateFilters();
        },

        saveFiltersToLocal: () => {
            const state = { ...appState.activeFilters, showRegions: document.getElementById('filter-show-regions').checked };
            localStorage.setItem('middleEarthFilters', JSON.stringify(state));
        },

        loadFiltersFromLocal: () => {
            const saved = localStorage.getItem('middleEarthFilters');
            if (saved) {
                try {
                    const state = JSON.parse(saved);
                    document.getElementById('filter-known').checked = state.known || false;
                    document.getElementById('filter-visited').checked = state.visited || false;
                    document.getElementById('filter-show-regions').checked = state.showRegions !== false;
                    state.colors?.forEach(color => {
                        const cb = document.querySelector(`.filter-color-checkbox[data-color="${color}"]`);
                        if (cb) cb.checked = true;
                    });
                    settingsManager.updateFilters();
                } catch(e) { console.error('Failed to load filters'); }
            }
        },

        // --- Season & Calendar ---
        loadSavedSeason: () => {
            const saved = localStorage.getItem('currentSeason');
            if (saved && CONSTANTS.SEASON_NAMES[saved]) {
                appState.currentSeason = saved;
            }
            if (!appState.isCalendarMode) {
                 const radio = document.querySelector(`input[name="season"][value="${appState.currentSeason}"]`);
                 if (radio) radio.checked = true;
            }
            settingsManager.updateSeasonDisplay();
        },

        updateSeasonDisplay: () => {
            const seasonMainName = appState.currentSeason.split('-')[0];
            const symbol = CONSTANTS.SEASON_SYMBOLS[seasonMainName] || '🌿';
            const fullName = CONSTANTS.SEASON_NAMES[appState.currentSeason] || appState.currentSeason;

            if (dom.seasonIndicator) {
                dom.seasonIndicator.textContent = symbol;
                dom.seasonIndicator.title = `Saison: ${fullName}`;
            }
            if (dom.calendarDateIndicator) {
                 dom.calendarDateIndicator.textContent = appState.currentCalendarDate ? `${appState.currentCalendarDate.day} ${appState.currentCalendarDate.month}` : '';
                 dom.calendarDateIndicator.classList.toggle('hidden', !appState.isCalendarMode || !appState.currentCalendarDate);
            }
        },

        calendar: {
             saveToLocal: () => {
                if (appState.calendarData) localStorage.setItem('calendarData', JSON.stringify(appState.calendarData));
                if (appState.currentCalendarDate) localStorage.setItem('currentCalendarDate', JSON.stringify(appState.currentCalendarDate));
                localStorage.setItem('isCalendarMode', appState.isCalendarMode.toString());
            },
            loadFromLocal: () => {
                try {
                    const savedCalendar = localStorage.getItem('calendarData');
                    const savedDate = localStorage.getItem('currentCalendarDate');
                    appState.isCalendarMode = localStorage.getItem('isCalendarMode') === 'true';
                    if (savedCalendar) appState.calendarData = JSON.parse(savedCalendar);
                    if (savedDate) appState.currentCalendarDate = JSON.parse(savedDate);
                } catch(e) { console.error('Error loading calendar data'); }
            }
        }
    };

    // ===================================================================================
    //  HELPER FUNCTIONS
    // ===================================================================================
    const helpers = {
        escapeHtml: (text) => {
            if (typeof text !== 'string') return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        getImages: (item) => item.images?.map(img => img.url).filter(Boolean) || (item.imageUrl ? [item.imageUrl] : []),
        getDefaultImage: (item) => {
            if (item.images?.length) {
                return (item.images.find(img => img.isDefault) || item.images[0]).url;
            }
            return item.imageUrl || '';
        },
        getTables: (item) => item.tables?.map(t => t.url).filter(Boolean) || [],
        getDefaultTable: (tables) => (tables.find(t => t.isDefault) || tables[0])?.url || '',
        getJsonTables: (item) => item.jsonTables?.map(t => t.content).filter(Boolean) || [],
        getDefaultJsonTable: (jsonTables) => (jsonTables.find(t => t.isDefault) || jsonTables[0])?.content || '',

        formatJsonTableForDisplay: (content) => {
            try {
                const parsed = JSON.parse(content);
                if (!Array.isArray(parsed)) throw new Error("Not an array");

                const isStandard = parsed[0]?.hasOwnProperty('Dé du destin');
                if (isStandard) {
                    return `<table class="w-full border-collapse border border-gray-600 text-sm">
                        <thead><tr class="bg-gray-700">
                            <th class="border border-gray-600 px-2 py-1">Dé du destin</th>
                            <th class="border border-gray-600 px-2 py-1">Résultat</th>
                            <th class="border border-gray-600 px-2 py-1">Description</th>
                        </tr></thead><tbody>
                        ${parsed.map(item => `
                            <tr>
                                <td class="border border-gray-600 px-2 py-1 font-bold text-center">${helpers.escapeHtml(item['Dé du destin'])}</td>
                                <td class="border border-gray-600 px-2 py-1 font-semibold">${helpers.escapeHtml(item['Résultat'])}</td>
                                <td class="border border-gray-600 px-2 py-1">${helpers.escapeHtml(item['Description'])}</td>
                            </tr>
                        `).join('')}
                        </tbody></table>`;
                } else {
                     return `<div class="space-y-2">${parsed.map((item, index) => `
                        <div class="bg-gray-800 rounded p-2 border border-gray-600">
                            <div class="font-semibold text-blue-400 mb-1">Entrée ${index + 1}</div>
                            ${Object.entries(item).map(([key, value]) => `<div><span class="font-medium">${helpers.escapeHtml(key)}:</span> ${helpers.escapeHtml(String(value))}</div>`).join('')}
                        </div>`).join('')}</div>`;
                }
            } catch (e) {
                return `<div class="text-red-400">Erreur d'affichage JSON: ${helpers.escapeHtml(e.message)}</div><pre class="font-mono text-xs">${helpers.escapeHtml(content)}</pre>`;
            }
        },

        generateRandomEvent: (jsonContent) => {
            try {
                const parsed = JSON.parse(jsonContent);
                if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Tableau vide ou invalide");
                const randomEntry = parsed[Math.floor(Math.random() * parsed.length)];

                if (randomEntry['Résultat'] && randomEntry['Description']) {
                    return `<strong>${helpers.escapeHtml(randomEntry['Résultat'])}</strong><br>${helpers.escapeHtml(randomEntry['Description'])}`;
                }
                return Object.entries(randomEntry).map(([k, v]) => `<strong>${helpers.escapeHtml(k)}:</strong> ${helpers.escapeHtml(v)}`).join('<br>');
            } catch (e) {
                return `Erreur: ${e.message}`;
            }
        }
    };

    // ===================================================================================
    //  INITIALIZATION
    // ===================================================================================
    function main() {
        console.log('🚀 Starting application...');
        dataManager.loadInitialData().then(() => {
            if (dom.mapImage) {
                dom.mapImage.onload = mapManager.initialize;
                dom.mapImage.onerror = () => console.error("Map image failed to load!");
                dom.mapImage.src = CONSTANTS.PLAYER_MAP_URL;
                 // If image is already cached, onload might not fire
                if (dom.mapImage.complete && dom.mapImage.naturalWidth > 0) {
                    mapManager.initialize();
                }
            }
            uiManager.initialize();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
})();
